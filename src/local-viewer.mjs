import {shouldAnimate} from "./motion.mjs";
/**
 * Lighting changes affect the renderer, not the authored AKM material.
 * All presets use the same real GLB geometry and RoomEnvironment IBL.
 */
export const LIGHTING_PRESETS=Object.freeze({
 cinematic:Object.freeze({label:"電影光影",background:0x0b1213,exposure:.96,ambient:.72,key:2.5,rim:1.35,fill:.52}),
 neutral:Object.freeze({label:"材質比對",background:0x202527,exposure:1.0,ambient:1.12,key:1.7,rim:.58,fill:.86}),
 inspection:Object.freeze({label:"細節檢視",background:0x121c1b,exposure:1.13,ambient:1.04,key:2.9,rim:1.05,fill:1.12})
});
export function validLightingPreset(name){
 return Object.hasOwn(LIGHTING_PRESETS,name)?name:"cinematic";
}
export function isIndependentPart(parts,part){
 return Boolean(parts&&Array.isArray(parts[part])&&parts[part].length>0);
}

/**
 * Lazy Three.js renderer for a locally reviewed, properly licensed AKM GLB.
 * Does not run until assets/models/akm.glb exists AND the user selects local 3D.
 * No false mesh segmentation: node names are inspected before part operations.
 */
export function findPartNodes(names) {
 const patterns={
  magazine:/(?:^|[_ .-])(magazine|mag|clip)(?:$|[_ .-])/i,
  stock:/(?:^|[_ .-])(stock|buttstock)(?:$|[_ .-])/i,
  barrel:/(?:^|[_ .-])(barrel)(?:$|[_ .-])/i,
  handguard:/(?:^|[_ .-])(handguard|foregrip)(?:$|[_ .-])/i
 };
 const result={magazine:[],stock:[],barrel:[],handguard:[]};
 for(const n of names){
  // Sockets, anchors, and attachment mounts are not detachable geometry.
  if(/(?:socket|mount|anchor|empty|marker)/i.test(n))continue;
  for(const [part,pattern] of Object.entries(patterns))if(pattern.test(n))result[part].push(n);
 }
 return result;
}
export async function mountLocalGLB(host,{url="./assets/models/akm.glb",onStatus=()=>{}}={}){
 if(!host)throw new TypeError("Missing 3D viewport");
 let renderer,controls,scene,asset,roomTarget,resizeObserver,disposed=false;
 let rootGroup=null,magazineFrame=0,magazineAnimating=false,cancelMagazine=null;
 let cameraFrame=0,cancelCameraMotion=null,ground=null;
 let defaultView=null,defaultDistance=0,focusBounds=null,lightingPreset="cinematic";
 const documentWindow=host.ownerDocument.defaultView || window;
 const [THREE,{GLTFLoader},{OrbitControls},{RoomEnvironment}]=await Promise.all([
  import("three"),
  import("three/addons/loaders/GLTFLoader.js"),
  import("three/addons/controls/OrbitControls.js"),
  import("three/addons/environments/RoomEnvironment.js")
 ]);
 if(!THREE.WebGLRenderer)throw new Error("Three.js unavailable");
 const canvas=document.createElement("canvas");
 canvas.className="local-glb-canvas";
 canvas.setAttribute("aria-label","本機 3D AKM 檢視器，拖動旋轉，雙指縮放");
 host.append(canvas);
 try {
  renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:!(documentWindow.matchMedia?.("(max-width:760px)")?.matches??false),powerPreference:"low-power"});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=LIGHTING_PRESETS.cinematic.exposure;
  renderer.setClearColor(LIGHTING_PRESETS.cinematic.background,1);
  renderer.setPixelRatio(Math.min(documentWindow.devicePixelRatio||1,(documentWindow.innerWidth<=760?1:1.5)));
  scene=new THREE.Scene();
  scene.background=new THREE.Color(LIGHTING_PRESETS.cinematic.background);
  const camera=new THREE.PerspectiveCamera(33,1,.005,500);
  const ambient=new THREE.HemisphereLight(0xc3d4c9,0x2b3431,.72);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xffe6c8,2.5);key.position.set(3.5,5.5,5.0);scene.add(key);
  const rim=new THREE.DirectionalLight(0xb0d8cf,1.35);rim.position.set(-4.0,2.4,-4.3);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xbcd5dc,.52);fill.position.set(-1.8,.3,4.6);scene.add(fill);
  // PMREM is required to make metal/roughness materials readable, but keep
  // highlights subdued; don't replace artist-authored roughness or metalness.
  const env=new RoomEnvironment();
  const pmrem=new THREE.PMREMGenerator(renderer);
  roomTarget=pmrem.fromScene(env,.04);
  scene.environment=roomTarget.texture;env.dispose();pmrem.dispose();
  controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=false;controls.autoRotate=false;controls.enablePan=false;
  controls.minDistance=.1;controls.maxDistance=20;
  controls.addEventListener("change",render);
  onStatus("讀取 AKM GLB 與材質…");
  const gltf=await new GLTFLoader().loadAsync(url);
  if(disposed)throw new Error("Viewer disposed during GLB load");
  asset=gltf.scene;
  rootGroup=new THREE.Group();scene.add(rootGroup);rootGroup.add(asset);
  const bounds=new THREE.Box3().setFromObject(asset);
  if(bounds.isEmpty())throw new Error("GLB does not contain renderable geometry");
  const dims=bounds.getSize(new THREE.Vector3());
  const maxDim=Math.max(dims.x,dims.y,dims.z);
  if(maxDim<.0001||!Number.isFinite(maxDim))throw new Error("GLB dimensions invalid");
  // Center without re-scaling the artist's geometry; dimensions stay true.
  const center=bounds.getCenter(new THREE.Vector3());asset.position.sub(center);
  // Camera fit uses *both* the current viewport width and height.
  // No mesh scaling; preserves true model aspect proportions.
  const fov=camera.fov*Math.PI/180;
  const aspect=Math.max(.3,host.clientWidth/Math.max(1,host.clientHeight));
  const longestX=dims.x>=Math.max(dims.y,dims.z);
  const longestY=dims.y>Math.max(dims.x,dims.z);
  const projectedWidth=longestX?dims.x:longestY?dims.y:dims.z;
  const projectedHeight=longestY?dims.z:dims.y;
  const distance=Math.max(
   projectedWidth/(2*Math.tan(fov/2)*aspect*.80),
   projectedHeight/(2*Math.tan(fov/2)*.73),
   maxDim*.40
  );
  camera.near=Math.max(.001,distance/1000);
  camera.far=Math.max(100,distance*10);
  defaultView=longestX?new THREE.Vector3(distance*.08,distance*.12,distance):
    longestY?new THREE.Vector3(distance,distance*.14,distance*.08):
      new THREE.Vector3(distance,distance*.12,distance*.08);
  camera.position.copy(defaultView);
  camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  controls.target.set(0,0,0);controls.minDistance=distance*.55;controls.maxDistance=distance*4;
  controls.update();
  defaultDistance=distance;
  // Genuine receiving geometry; only enabled when the user loads the real GLB.
  // Real-time contact shadows are desktop-only to respect mobile GPU budgets.
  const isTouch=documentWindow.matchMedia?.("(pointer: coarse)")?.matches||documentWindow.innerWidth<=760;
  const groundMaterial=new THREE.MeshStandardMaterial({
   color:0x1d2725,roughness:.9,metalness:.05,side:THREE.DoubleSide
  });
  ground=new THREE.Mesh(new THREE.CircleGeometry(maxDim*.82,64),groundMaterial);
  ground.name="StudioFloor_NotWeaponPart";
  ground.rotation.x=-Math.PI/2;
  ground.position.set(0,(-dims.y/2)-maxDim*.025,0);
  ground.receiveShadow=!isTouch;scene.add(ground);
  if(!isTouch){
   renderer.shadowMap.enabled=true;
   renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   key.castShadow=true;
   key.shadow.mapSize.set(1024,1024);
   key.shadow.camera.left=-maxDim*1.6;key.shadow.camera.right=maxDim*1.6;
   key.shadow.camera.top=maxDim*1.2;key.shadow.camera.bottom=-maxDim*1.2;
   key.shadow.camera.near=.01;key.shadow.camera.far=maxDim*11;
   key.shadow.bias=-.0001;
  }
  asset.traverse(n=>{if(n.isMesh)n.castShadow=!isTouch;});
  const names=[],materials=new Set(),meshes=[];
  asset.traverse(n=>{
   if(n.isMesh){
    meshes.push(n);names.push(n.name||"unnamed");
    const items=Array.isArray(n.material)?n.material:[n.material];
    for(const mat of items)if(mat){materials.add(mat.name||mat.type);}
   }
  });
  const parts=findPartNodes(names);
  const magMesh=meshes.find(obj=>obj.name==="AKM_Magazine");
  const canMoveCamera=()=>!disposed&&shouldAnimate()&&
   !documentWindow.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  function stopCameraMotion(){
   if(cameraFrame)documentWindow.cancelAnimationFrame(cameraFrame);
   cameraFrame=0;
   cancelCameraMotion=null;
   canvas.dataset.cameraMoving="false";
  }
  controls.addEventListener("start",stopCameraMotion);
  function moveCamera(position,target,focusName){
   stopCameraMotion();
   const startPosition=camera.position.clone(),startTarget=controls.target.clone();
   const endPosition=position.clone(),endTarget=target.clone();
   controls.minDistance=focusName==="magazine"?defaultDistance*.18:defaultDistance*.55;
   canvas.dataset.cameraFocus=focusName;
   if(!canMoveCamera()){
    camera.position.copy(endPosition);controls.target.copy(endTarget);
    controls.update();render();return;
   }
   const start=documentWindow.performance.now();
   const duration=540;
   const tick=now=>{
    if(disposed){stopCameraMotion();return;}
    const t=Math.min(1,(now-start)/duration),ease=t*t*(3-2*t);
    camera.position.lerpVectors(startPosition,endPosition,ease);
    controls.target.lerpVectors(startTarget,endTarget,ease);
    controls.update();render();
    if(t<1)cameraFrame=documentWindow.requestAnimationFrame(tick);
    else stopCameraMotion();
   };
   canvas.dataset.cameraMoving="true";
   cameraFrame=documentWindow.requestAnimationFrame(tick);
   cancelCameraMotion=stopCameraMotion;
  }
  function focusPart(part){
   if(part!=="magazine"||!isIndependentPart(parts,"magazine")||
      !magMesh?.visible||magazineAnimating)return false;
   const box=new THREE.Box3().setFromObject(magMesh);
   if(box.isEmpty())return false;
   const center=box.getCenter(new THREE.Vector3());
   const size=box.getSize(new THREE.Vector3());
   const direction=camera.position.clone().sub(controls.target).normalize();
   const minView=Math.max(size.length()*3.1,defaultDistance*.31);
   const focalDistance=Math.min(defaultDistance*.95,minView);
   focusBounds={center:center.clone(),size:size.clone()};
   moveCamera(center.clone().addScaledVector(direction,focalDistance),center,"magazine");
   return true;
  }
  function setLightingPreset(id){
   const name=validLightingPreset(id),p=LIGHTING_PRESETS[name];
   lightingPreset=name;
   renderer.toneMappingExposure=p.exposure;
   scene.background.setHex(p.background);
   ambient.intensity=p.ambient;key.intensity=p.key;
   rim.intensity=p.rim;fill.intensity=p.fill;
   if(ground)ground.material.color.setHex(name==="neutral"?0x262f2d:0x192522);
   canvas.dataset.lightingPreset=name;
   render();
   return name;
  }
  setLightingPreset("cinematic");
  async function animateMagazine(){
    const mag=magMesh;
    // A model-topology inspection cue, not a real inventory interaction.
    if(!mag||magazineAnimating||disposed||!mag.visible)return false;
    if(!shouldAnimate()||documentWindow.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches){
      mag.visible=false;render();mag.visible=true;render();return true;
    }
    magazineAnimating=true;
    canvas.dataset.magazineMaxDisplacement="0";
    canvas.dataset.magazineDisplacement="0";
    mag.parent?.updateWorldMatrix(true,false);
    const parentOrientation=new THREE.Quaternion();
    mag.parent?.getWorldQuaternion(parentOrientation);
    const direction=new THREE.Vector3(0,-1,0)
      .applyQuaternion(parentOrientation.invert())
      .normalize().multiplyScalar(maxDim*.17);
    const origin=mag.position.clone(),started=performance.now();
    const ease=t=>1-Math.pow(1-t,3);
    return await new Promise(resolve=>{
      function finish(ok){
        if(magazineFrame)documentWindow.cancelAnimationFrame(magazineFrame);
        magazineFrame=0;
        mag.position.copy(origin);
        canvas.dataset.magazineDisplacement="0";
        if(!disposed)render();
        magazineAnimating=false;
        cancelMagazine=null;
        resolve(ok);
      }
      cancelMagazine=()=>finish(false);
      const tick=now=>{
        if(disposed){finish(false);return;}
        const t=Math.min(1,(now-started)/960);
        const progress=t<.40?ease(t/.40):t<.58?1:1-ease((t-.58)/.42);
        mag.position.copy(origin).addScaledVector(direction,progress);
        const travelled=mag.position.distanceTo(origin);
        canvas.dataset.magazineDisplacement=travelled.toFixed(6);
        canvas.dataset.magazineMaxDisplacement=Math.max(
          Number(canvas.dataset.magazineMaxDisplacement||0),travelled
        ).toFixed(6);
        render();
        if(t<1)magazineFrame=documentWindow.requestAnimationFrame(tick);
        else finish(true);
      };
      magazineFrame=documentWindow.requestAnimationFrame(tick);
    });
  }
  function setPartVisible(name,visible){
    // Research inspection: independently hidden mesh must not hide the rest.
    const matches=meshes.filter(obj=>obj.name===name);
    if(matches.length!==1)return false;
    matches[0].visible=Boolean(visible);render();return true;
  }
  function setWireframe(enabled){
    for(const mesh of meshes){
      for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
        if(mat&&"wireframe" in mat){mat.wireframe=Boolean(enabled);mat.needsUpdate=true;}
      }
    }
    render();
  }
  function resetCamera(){
    focusBounds=null;
    moveCamera(defaultView,new THREE.Vector3(0,0,0),"overview");
  }
  function resize(){
   if(disposed||!renderer)return;
   const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);
   const ratio=Math.min(documentWindow.devicePixelRatio||1,width>760?1.5:1,1440/width,900/height);
   renderer.setPixelRatio(Math.max(.5,ratio));
   camera.aspect=width/height;camera.updateProjectionMatrix();
   renderer.setSize(width,height,false);render();
  }
  function render(){if(!disposed&&renderer)renderer.render(scene,camera);}
  if(typeof ResizeObserver!=="undefined"){
   resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  }else documentWindow.addEventListener("resize",resize,{passive:true});
  resize();
  onStatus("載入完成："+meshes.length+" 個網格、"+materials.size+" 種材質。已辨識彈匣節點："+parts.magazine.length+" 個；無法僅依名稱保證可拆件。");
  return {
   root:rootGroup,parts,meshCount:meshes.length,materialCount:materials.size,
   setPartVisible,animateMagazine,setWireframe,resetCamera,focusPart,
   setLightingPreset,render,resize,
   dispose(){
    cancelMagazine?.();cancelCameraMotion?.();stopCameraMotion();
    disposed=true;
    if(magazineFrame)documentWindow.cancelAnimationFrame(magazineFrame);
    magazineFrame=0;resizeObserver?.disconnect();
    controls?.dispose();
    if(asset){
     const materialsToDispose=new Set();
     asset.traverse(obj=>{
      if(!obj.isMesh)return;
      obj.geometry?.dispose();
      for(const m of Array.isArray(obj.material)?obj.material:[obj.material])if(m)materialsToDispose.add(m);
     });
     for(const mat of materialsToDispose){
      for(const value of Object.values(mat))if(value?.isTexture)value.dispose();
      mat.dispose();
     }
    }
    if(ground){ground.geometry.dispose();ground.material.dispose();scene.remove(ground);}
    key.shadow?.dispose();
    roomTarget?.dispose();renderer?.dispose();renderer?.forceContextLoss();canvas.remove();
   }
  };
 }catch(error){
  disposed=true;resizeObserver?.disconnect();controls?.dispose();roomTarget?.dispose();
  renderer?.dispose();canvas.remove();throw error;
 }
}
