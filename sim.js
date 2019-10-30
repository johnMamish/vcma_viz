import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r108/build/three.module.js';

import  vcma_mtj_sim from './vcma_llg_sim.js';

/**
 * Given the names of 3 html text fields in the document making up a vector, this function will
 * normalize their magnitude to 1, write the normalized values back to the text fields, and
 * return an array containing the normalized values
 */
function normalize_3vector_textfields(names)
{

    document.getElementById(names[i]);
}

/**
 * vect should be 3 elements.
 */
function draw_vector(scene, c, vect)
{
    var direction = new THREE.Vector3(vect[0], vect[1], vect[2]);
    direction.normalize();
    var origin = new THREE.Vector3(0.0, 0.0, 0.0);
    var length = 1;
    var arrow = new THREE.ArrowHelper(direction, origin, length, c);
    scene.add(arrow);
}

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas});
    //debugger;
    const fov = 90;
    const aspect = 1;    // The canvas default
    const near = 0.1;    // Frustrum distances
    const far = 10;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;
    camera.position.y = 0;

    var sim = new vcma_mtj_sim();

    var start = null;
    var prevtime = 0;
    function render(time) {
        var dt = time - prevtime;
        // step simulation; 0.002 picoseconds / millisecond
        sim.step_simulation(dt * 1000);
        prevtime = time;

        console.log("M = " + sim.M);
        var norm2 = 0;
        var i = 0;
        for (i = 0; i < 3; i++) {
            norm2 += sim.M[i] * sim.M[i];
        }
        for (i = 0; i < 3; i++) {
                sim.M[i] /= Math.sqrt(norm2);
        }
        console.log("||M|| = " + norm2);

        // setup new scene
        var myscene = new THREE.Scene();
        {
	    const color = 0xffffff;
	    const intensity = 1;
	    const light = new THREE.DirectionalLight
	    light.position.set(-1, 2, 4);
	    myscene.add(light);
        }
        draw_vector(myscene, "#ff0000", sim.M);
        draw_vector(myscene, "#00ff00", sim.H_eff);

	renderer.render(myscene, camera);
	requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();
