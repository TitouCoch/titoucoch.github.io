//get the DOM element in which you want to attach the scene
const containerGlobe = document.querySelector('#containerGlobe');

//create a WebGL renderer
const renderer = new THREE.WebGLRenderer();

//set the attributes of the renderer
const WIDTH = window.innerWidth - 700;
const HEIGHT = window.innerHeight - 300;

//set the renderer size
renderer.setSize(WIDTH, HEIGHT);

//Adding a Camera

//set camera attributes
const VIEW_ANGLE = 45;
const ASPECT = WIDTH / HEIGHT;
const NEAR = 0.1;
const FAR = 10000;

//create a camera
const camera = new THREE.PerspectiveCamera(
    VIEW_ANGLE,
    ASPECT,
    NEAR,
    FAR
);

//set the camera position - x, y, z
camera.position.set( 0, 0, 500 );

// Create a scene
const scene = new THREE.Scene();

//set the scene background
scene.background = new THREE.Color(0x000);

//add the camera to the scene.
scene.add(camera);



// Attach the renderer to the DOM element.
containerGlobe.appendChild(renderer.domElement);

//Three.js uses geometric meshes to create primitive 3D shapes like spheres, cubes, etc. I’ll be using a sphere.

// Set up the sphere attributes
const RADIUS = 200;
const SEGMENTS = 50;
const RINGS = 50;

//Create a group (which will later include our sphere and its texture meshed together)
const globe = new THREE.Group();
//add it to the scene
scene.add(globe);


// Create a red dot material
const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
// Create a red dot

// Create a red dot geometry
const dotGeometry = new THREE.SphereGeometry(3, 32, 32); // Augmenter le rayon du point à 5

const clickableDots = [];

// Create an array of country data
const countryData = [
    { name: 'Malta', lat: 34.9375, lon: 104.375 },
    { name: 'France', lat: 46.603354, lon: 91.888334 },
    { name: 'Spain', lat: 39.463667, lon: 85.74922 },
    { name: 'England', lat: 52.5074, lon: 88.1278 },
    { name: 'Latvia', lat: 56.8796, lon: 114.6032 },
    { name: 'Italy', lat: 42, lon: 104.371 }
  ];
  

  // Loop through the country data and create clickable dots
  countryData.forEach((country) => {
    // Convert latitude and longitude to radians
    const latRad = country.lat * (Math.PI / 180);
    const lonRad = country.lon * (Math.PI / 180);
  
    // Calculate the position of the dot on the sphere
    const x = Math.cos(latRad) * Math.sin(lonRad) * RADIUS;
    const y = Math.sin(latRad) * RADIUS;
    const z = Math.cos(latRad) * Math.cos(lonRad) * RADIUS;
  
    // Create a dot mesh
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.set(x, y, z);
    globe.add(dot);
    clickableDots.push({ mesh: dot, name: country.name });

});


//Let's create our globe using TextureLoader

// instantiate a loader
var loader = new THREE.TextureLoader();
loader.load( './globe.png', function ( texture ) {
    //create the sphere
    var sphere = new THREE.SphereGeometry( RADIUS, SEGMENTS, RINGS );

    //map the texture to the material. Read more about materials in three.js docs
    var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5 } );

    //create a new mesh with sphere geometry. 
    var mesh = new THREE.Mesh( sphere, material );

    //add mesh to globe group
    globe.add(mesh);
} );

// Move the sphere back (z) so we can see it.
globe.position.z = -300;

//Update

//set update function to transform the scene and view
function update () {
    //render
    renderer.render(scene, camera);

    //schedule the next frame.
    requestAnimationFrame(update);
}

//schedule the first frame.
requestAnimationFrame(update);


// Atmosphere
const atmosphereRadius = RADIUS + 100; // Rayon de l'atmosphère (plus grand que le rayon du globe)
const atmosphereGeometry = new THREE.SphereGeometry(atmosphereRadius, SEGMENTS, RINGS);
const atmosphereMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide, // Afficher l'atmosphère à l'arrière du matériau
    vertexShader: `
        varying vec3 vNormal;

        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;

        void main() {
            float intensity = pow(dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(0.0, 0.0, intensity, 1.0);
        }
    `
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
globe.add(atmosphere);






// Mouse Interaction
let isDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};

const rotationSpeedX = 0.2; // Vitesse de rotation horizontale
const rotationSpeedY = 0.2; // Vitesse de rotation verticale

function onMouseMove(event) {
    if (!isDragging) return;

    const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
    };

    const deltaRotationQuaternion = new THREE.Quaternion()
        .setFromEuler(
            new THREE.Euler(
                toRadians(deltaMove.y * rotationSpeedY),
                toRadians(deltaMove.x * rotationSpeedX),
                0,
                'XYZ'
            )
        );

    globe.quaternion.multiplyQuaternions(deltaRotationQuaternion, globe.quaternion);

    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

function onMouseUp(event) {
    isDragging = false;
}

// Attach mouse event listeners to the renderer element
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mouseup', onMouseUp);
  