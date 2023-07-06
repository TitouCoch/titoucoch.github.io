//get the DOM element in which you want to attach the scene
const container = document.querySelector('#containerGlobe');
const country = document.getElementById('destination');


// Create an array of country data
const countryData = [
    { name: 'Malta', lat: 34.9375, lon: 104.375 },
    { name: 'France', lat: 46.603354, lon: 91.888334 },
    { name: 'Spain', lat: 39.463667, lon: 85.74922 },
    { name: 'England', lat: 52.5074, lon: 88.1278 },
    { name: 'Latvia', lat: 56.8796, lon: 114.6032 },
    { name: 'Estonia', lat: 58.8796, lon: 114.6032 },
    { name: 'Lithuania', lat: 54.9, lon: 113.3032 },
    { name: 'Italy', lat: 42, lon: 104.371 }
  ];


//create a WebGL renderer
const renderer = new THREE.WebGLRenderer();

//set the attributes of the renderer
const WIDTH = window.innerWidth - 700;
const HEIGHT = window.innerHeight - 100;

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
scene.background = new THREE.Color( 0x000 );

//add the camera to the scene.
scene.add(camera);

// Attach the renderer to the DOM element.
container.appendChild(renderer.domElement);

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
const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });
// Create a red dot

// Create a red dot geometry
const dotGeometry = new THREE.SphereGeometry(3, 32, 32); // Augmenter le rayon du point à 5

const clickableDots = [];  

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


// Loop through the clickable dots array and add click events
clickableDots.forEach((dot) => {
    dot.mesh.userData.countryName = dot.name; // Ajouter la propriété "countryName" au maillage du point

    // Ajouter l'événement de clic au maillage du point
    dot.mesh.addEventListener('click', onDotClick);
});

// Fonction de gestion de l'événement de clic sur un point
function onDotClick(event) {
    const countryName = event.target.userData.countryName; // Récupérer le nom du pays à partir de la propriété "countryName" du maillage du point
    console.log('Pays cliqué :', countryName);
}

// Fonction pour convertir les coordonnées de l'événement de clic en coordonnées normalisées
function getNormalizedMouseCoordinates(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    return { x, y };
}

// Ajouter l'événement de clic sur le rendu du globe
renderer.domElement.addEventListener('click', (event) => {
    const mouseCoordinates = getNormalizedMouseCoordinates(event);

    // Lancer un rayon depuis la position de la souris
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouseCoordinates, camera);

    // Rechercher les intersections avec les maillages des points
    const intersects = raycaster.intersectObjects(clickableDots.map((dot) => dot.mesh));

    if (intersects.length > 0) {
        // Un point a été cliqué
        const clickedDot = intersects[0].object;
        const countryName = clickedDot.userData.countryName;
        country.innerHTML = "("+countryName+")";
    }
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

//Lighting

//create a point light (won't make a difference here because our material isn't affected by light)
const pointLight =
new THREE.PointLight(0xFFFFFF);

//set its position
pointLight.position.x = 10;
pointLight.position.y = 50;
pointLight.position.z = 400;

//add light to the scene
scene.add(pointLight);

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
const atmosphereRadius = RADIUS + 90; // Rayon de l'atmosphère (plus grand que le rayon du globe)
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

