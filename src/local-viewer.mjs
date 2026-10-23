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
 let rootGroup=null;
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
  renderer.toneMappingExposure=.82;
  renderer.setClearColor(0x141c1e,1);
  renderer.setPixelRatio(Math.min(documentWindow.devicePixelRatio||1,(documentWindow.innerWidth<=760?1:1.5)));
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x141c1e);
  const camera=new THREE.PerspectiveCamera(33,1,.005,500);
  scene.add(new THREE.HemisphereLight(0xc3c8bf,0x303638,.95));
  const key=new THREE.DirectionalLight(0xe3ddd0,1.55);key.position.set(2.5,4,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xa4b6b5,.45);rim.position.set(-4,2,-4);scene.add(rim);
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
  const defaultView=longestX?new THREE.Vector3(distance*.08,distance*.12,distance):
    longestY?new THREE.Vector3(distance,distance*.14,distance*.08):
      new THREE.Vector3(distance,distance*.12,distance*.08);
  camera.position.copy(defaultView);
  camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  controls.target.set(0,0,0);controls.minDistance=distance*.55;controls.maxDistance=distance*4;
  controls.update();
  const names=[],materials=new Set(),meshes=[];
  asset.traverse(n=>{
   if(n.isMesh){
    meshes.push(n);names.push(n.name||"unnamed");
    const items=Array.isArray(n.material)?n.material:[n.material];
    for(const mat of items)if(mat){materials.add(mat.name||mat.type);}
   }
  });
  const parts=findPartNodes(names);
  function setWireframe(enabled){
    for(const mesh of meshes){
      for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
        if(mat&&"wireframe" in mat){mat.wireframe=Boolean(enabled);mat.needsUpdate=true;}
      }
    }
    render();
  }
  function resetCamera(){
    camera.position.copy(defaultView);controls.target.set(0,0,0);controls.update();render();
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
   setWireframe,resetCamera,render,resize,
   dispose(){
    disposed=true;resizeObserver?.disconnect();
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
    roomTarget?.dispose();renderer?.dispose();renderer?.forceContextLoss();canvas.remove();
   }
  };
 }catch(error){
  disposed=true;resizeObserver?.disconnect();controls?.dispose();roomTarget?.dispose();
  renderer?.dispose();canvas.remove();throw error;
 }
}
