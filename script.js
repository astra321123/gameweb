window.onload = function(){

const canvas = document.getElementById("gameCanvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth/window.innerHeight,
  0.1,
  1000
);

let cameraOffset = new THREE.Vector3(0, 3, -5);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// ====== إضاءة ======
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,10,7.5);
scene.add(light);

// ====== أرضية ======
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({color:0x222222})
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// ====== تحميل شخصية ======
const loader = new GLTFLoader();
let player, mixer, actions = {}, activeAction;

loader.load(
  "https://threejs.org/examples/models/gltf/Xbot.glb",
  function(gltf){
    player = gltf.scene;
    scene.add(player);

    mixer = new THREE.AnimationMixer(player);
    gltf.animations.forEach(clip => {
        actions[clip.name] = mixer.clipAction(clip);
    });

    activeAction = actions['Idle'];
    if(activeAction) activeAction.play();
  }
);

// ====== جويستيك ======
const joystick = nipplejs.create({
    zone: document.getElementById('joystick-container'),
    mode: 'static',
    position: { left: '50%', bottom: '50px' },
    color: 'white'
});

let move = {x:0, z:0};
joystick.on('move', function(evt, data){
    const force = data.force;
    const angle = data.angle.radian;
    move.x = Math.sin(angle)*force;
    move.z = Math.cos(angle)*force;
});
joystick.on('end', function(){ move.x=0; move.z=0; });

// ====== أنيميشن ======
function setAction(name){
    if(!actions[name]) return;
    if(activeAction===actions[name]) return;
    if(activeAction) activeAction.fadeOut(0.2);
    activeAction = actions[name];
    activeAction.reset().fadeIn(0.2).play();
}

// ====== تحديث ======
const clock = new THREE.Clock();
let velocity = new THREE.Vector3(0,0,0);

function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if(player){
        player.position.x += move.x * delta * 5;
        player.position.z += move.z * delta * 5;

        velocity.y -= 9.8 * delta;
        player.position.y += velocity.y * delta;
        if(player.position.y<0){ player.position.y=0; velocity.y=0; }

        if(player.position.y>0){ setAction('Jump'); }
        else if(move.x!==0 || move.z!==0){ setAction('Run'); }
        else { setAction('Idle'); }

        camera.position.copy(player.position).add(cameraOffset);
        camera.lookAt(player.position);
    }

    if(mixer) mixer.update(delta);
    renderer.render(scene, camera);
}
animate();

};
