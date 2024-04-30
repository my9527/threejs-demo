


import { useEffect } from "react";
import * as THREE from "three";
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function KMToLY( kilometers: number ){
	return kilometers * 1.05702341 * Math.pow(10,-13);
}

// function createSpaceRadius( radius: number, color: string | number, representationScale: number ){
// 	color = color ? color : 0xffffff;
// 	representationScale = representationScale ? representationScale : 1;

// 	var width = Math.sqrt(radius) * 0.00001 * representationScale;
// 	var thickness = radius * 0.0005;
// 	var textureRepeat = 30;

// 	var resolution = 180;
// 	var twoPI = Math.PI * 2;
// 	var angPerRes = twoPI / resolution;	
// 	var verts = [];
// 	for( var i=0; i<twoPI; i+=angPerRes ){
// 		var x = Math.cos( i ) * radius;
// 		var y = Math.sin( i ) * radius;
// 		var v = new THREE.Vector3( x,y,0 );
// 		verts.push( v );
// 	}

// 	var geometry = new THREE.Geometry();
// 	geometry.vertices = verts;


// 	var areaOfWindow = window.innerWidth * window.innerHeight;

// 	var pointSize = 0.000004 * areaOfWindow;

// 	var particleMaterial = new THREE.ParticleBasicMaterial( 
// 		{
// 			color: color, 
// 			size: pointSize, 
// 			sizeAttenuation: false, 
// 			map: guidePointTexture,
// 			blending: THREE.AdditiveBlending,
// 			depthTest: false,
// 			depthWrite: false,
// 		} 
// 	);

// 	var mesh = new THREE.ParticleSystem( geometry, particleMaterial );

// 	mesh.update = function(){
// 		if( camera.position.z < 2.0 )
// 			this.visible = false
// 		else
// 		if( camera.position.z < 800)
// 			this.visible = true;
// 		else
// 			this.visible = false;
// 	}
	
// 	mesh.rotation.x = Math.PI/2;
// 	return mesh;
// }

var galacticTexture0 = new THREE.TextureLoader().load( "/textures/sprites/galactic_sharp.png" );
var galacticTexture1 =  new THREE.TextureLoader().load( "/textures/sprites/galactic_blur.png" );


var galacticUniforms = {
	color:     { type: "c", value: new THREE.Color( 0xffffff ) },
	texture0:   { type: "t", value: galacticTexture0 },
	texture1:   { type: "t", value: galacticTexture1 },
	idealDepth: { type: "f", value: 1.0 },
	blurPower: { type: "f", value: 1.0 },
	blurDivisor: { type: "f", value: 2.0 },
	sceneSize: { type: "f", value: 120.0 },
	cameraDistance: { type: "f", value: 800.0 },
	zoomSize: 	{ type: "f", value: 1.0 },
	scale: 		{ type: "f", value: 1.0 },
	heatVision: { type: "f", value: 0.0 },
};

var galacticAttributes = {
	size: 			{ type: 'f', value: [] },
	customColor: 	{ type: 'c', value: [] }
};



function random(low: number, high: number) {
    if (low >= high) return low;
    var diff = high - low;
    return (Math.random() * diff) + low;
}

function constrain(v: number, min: number, max: number) {
    if (v < min)
        v = min;
    else
        if (v > max)
            v = max;
    return v;
}

const minRotationY = THREE.MathUtils.degToRad(0); // 最小旋转角度，-45度
const maxRotationY = THREE.MathUtils.degToRad(45);




export default () => {


    // @ts-ignore
    let renderer, scene, camera, stats, controls, galacticShaderMaterial, plane, galacticTopMaterial, cube, cube2;

    let sphere;

    const WIDTH = window.innerWidth / 2;
    const HEIGHT = window.innerHeight;




    function init() {

        console.log("asdasdf init");

        camera = new THREE.PerspectiveCamera(40, WIDTH / HEIGHT, 1, 900000);
        camera.position.x = 900000 / 10;
        camera.position.y = 900000 / 10;



        scene = new THREE.Scene();

        const amount = 100000;

        const radius = 200;

        const positions = new Float32Array(amount * 3);
        const colors = new Float32Array(amount * 3);

        const sizes = new Float32Array(amount);

        const vertex = new THREE.Vector3();
        const color = new THREE.Color(0xffffff);



        galacticShaderMaterial = new THREE.ShaderMaterial( {
            uniforms: 		galacticUniforms,
            // attributes:     galacticAttributes,
            vertexShader:   'attribute float size;\nattribute vec3 customColor;\n\nvarying vec3 vColor;\nvarying float dist;\nvarying float pSize;\n\nuniform float zoomSize;\nuniform float scale;\n\nvoid main() {\n\n\tvColor = customColor;\n\n\tvec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n\n\tdist = length( mvPosition.xyz );\n\n\tfloat finalSize = scale * size / length( mvPosition.xyz );\n\n\t//gl_PointSize = clamp( scaledSize , 0., 4000.);\n\t//gl_PointSize = size * ( scale / length( mvPosition.xyz ));\n\n\tgl_PointSize = finalSize;\n\n\tgl_Position = projectionMatrix * mvPosition;\n\tpSize = finalSize;\n\n}',
            fragmentShader: 'uniform vec3 color;\nuniform sampler2D texture0;\nuniform sampler2D texture1;\nuniform float idealDepth;\nuniform float blurPower;\nuniform float blurDivisor;\nuniform float sceneSize;\nuniform float cameraDistance;\nuniform float heatVision;\n\nvarying vec3 vColor;\nvarying float dist;\nvarying float pSize;\n\nvoid main() {\t\n\tvec4 particleColor = vec4(color*vColor, 1.0);\n\tfloat bwColor = length(particleColor) * 0.15 * heatVision;\n\tparticleColor.xyz *= (1.0-heatVision);\n\tparticleColor.xyz += bwColor;\n\n\tfloat depth = gl_FragCoord.z / gl_FragCoord.w;\n\tdepth = (depth / (sceneSize + cameraDistance) );\n\n\tfloat focus = clamp( depth - pSize, 0., 1. );\n\n\tvec4 color0 = texture2D(texture0, vec2(gl_PointCoord.x, gl_PointCoord.y) );\n\tvec4 color1 = texture2D(texture1, gl_PointCoord );\n\n\tvec4 diffuse = mix( color0, color1, clamp(depth,0.,1.) );\t\n\n\tgl_FragColor = particleColor * diffuse;\n\n\n}',
    
            blending: 		THREE.AdditiveBlending,
            depthTest: 		false,
            depthWrite: 	false,
            transparent:	true,
            // sizeAttenuation: true,
            opacity: 		0.0,
        });
    



        var count = 100000;
        var numArms = 5;
        var arm = 0;
        var countPerArm = count / numArms;
        var ang = 0;
        var dist = 0;

        let maxX = 0;
        let minZ = 0;

        for (let i = 0; i < amount; i++) {

            var x = Math.cos(ang) * dist;
            var y = 0;
            var z = Math.sin(ang) * dist;

            //	scatter
            var sa = 100 - Math.sqrt(dist);				//	scatter amt
            if (Math.random() > 0.3)
                sa *= (1 + Math.random()) * 4;
            x += random(-sa, sa);
            z += random(-sa, sa);

            var distanceToCenter = Math.sqrt(x * x + z * z);
            var thickness = constrain(Math.pow(constrain(90 - distanceToCenter * 0.1, 0, 100000), 2) * 0.02, 2, 10000) + Math.random() * 120;
            y += random(-thickness, thickness);
            x *= 20;
		    y *= 20;
		    z *= 20;

            minZ = minZ < z ? minZ : z;

            maxX = maxX > x ? maxX : x;

            // vertex.x = (Math.random() * 2 - 1) * radius;
            vertex.x = x;
            // vertex.y = (Math.random() * 2 - 1) * radius;
            vertex.y = y;
            // vertex.z = (Math.random() * 2 - 1) * radius;
            vertex.z = z;
            vertex.toArray(positions, i * 3);

            // color.setHSL( 0.6, 0.75, 0.25 + vertex.y / ( 2 * radius ) );
            color.setHSL(0.5 + 0.1 * (i / amount), 0.7, 1);
            // if ( vertex.x < 0 ) {

            //     color.setHSL( 0.5 + 0.1 * ( i / amount ), 0.7, 0.5 );

            // } else {

            //     color.setHSL( 0.0 + 0.1 * ( i / amount ), 0.9, 0.5 );

            // }
            color.toArray(colors, i * 3);

            let _size = 200 + constrain( 600/dist,0,32000);
            if( Math.random() > 0.99 ){
                _size *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * .9;
            } else  {
                if( Math.random() > 0.7 ){
                    _size *= 1 + Math.pow(1 + Math.random(), 2) * .04;
                }
                
                if( i == 0 ){
                    _size = 1000
                }
            }

            // var p = new THREE.Vector3(x,y,z);
            //     p.size = 200 + constrain( 600/dist,0,32000);	
            //     if( Math.random() > 0.99 )
            //         p.size *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * .9;	
            //     else
            //         if( Math.random() > 0.7 )
            //             p.size *= 1 + Math.pow(1 + Math.random(), 2) * .04;

            //     if( i == 0 ){
            //         p.size = 100000;
            //         // p.x = -100 * 20;
            //         // p.y = 0;
            //         // p.z = -1500 * 20;;
            //     }

            sizes[i] = _size;

            

            ang += 0.0002;
            dist += .08;

            if( i % countPerArm == 0 ){
                ang = Math.PI * 2 / numArms * arm;
                dist = 0;
                arm++;
            }

        }

        console.log('init', maxX);


        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));



        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xffffff) },
                pointTexture: { value: new THREE.TextureLoader().load('textures/sprites/spark1.png') }
            },
            vertexShader: document.getElementById('vertexshader')!.textContent as string,
            fragmentShader: document.getElementById('fragmentshader')!.textContent as string,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true

        });

        sphere = new THREE.Points(geometry, material);
        sphere.position.x = 0;


        //
        galacticTopMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('/textures/sprites/galactictop.png'),
            blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite: false,
            side: THREE.DoubleSide,
            transparent: true,
        });

        plane = new THREE.Mesh( new THREE.PlaneGeometry(150000,150000, 30, 30), galacticTopMaterial );
        plane.rotation.x = Math.PI/2;
        // plane.material.map.anisotropy = 16;
        plane.material.map!.anisotropy = 16;


        // 添加目标

        const geometryTarget = new THREE.BoxGeometry(10, 10, 10, 30, 30, 30);
        const materialTarget = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        cube = new THREE.Mesh(geometryTarget, materialTarget);
        cube.position.x = 0;

        const geometryTarget2 = new THREE.BoxGeometry(10, 10, 10, 30, 30, 30);
        const materialTarget2 = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        cube2 = new THREE.Mesh(geometryTarget2, materialTarget2);
        cube2.position.z = 0;
        // cube.position.x = minZ;
        // cube.position.y = 0;
        // cube.position.z = 0;
        

        sphere.add(cube);






        // sphere.position.x = 11404;
        // sphere.position.y = 14000;
        // sphere.position.z = 10000;


        sphere.add(plane);


    
        // scene.add(plane);


        scene.add(sphere);





        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(WIDTH, HEIGHT);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.minDistance = 10;
        // controls.enableRotate = false;
        controls.maxDistance = maxX * 10;

        const container = document.getElementById('container');
        container!.appendChild(renderer.domElement);

        stats = new Stats();
        container!.appendChild(stats.dom);

        //

        window.addEventListener('resize', onWindowResize);



    }

    function onWindowResize() {

        camera!.aspect = window.innerWidth / window.innerHeight;
        camera!.updateProjectionMatrix();

        renderer!.setSize(window.innerWidth, window.innerHeight);

    }

    function animate() {

        requestAnimationFrame(animate);

        render();
        stats!.update();

    }
    function render() {

        const time = Date.now() * 0.005;

        sphere!.rotation.z = 0.01 * time;
        sphere!.rotation.z =  Math.max(minRotationY, Math.min(maxRotationY, sphere!.rotation.z));

        const geometry = sphere!.geometry;
        // galacticTopMaterial!.opacity = 0;

        // if( Math.abs(camera!.position.x) < 2500 && Math.abs(camera!.position.y) < 2500){
		// 	if( galacticTopMaterial!.opacity > 0 ){
        //         galacticTopMaterial!.opacity -= 0.05;
        //     }
        //     cube!.visible = true;
            
		// }
		// else{
		// 	if( galacticTopMaterial!.opacity < 1 ){
        //         galacticTopMaterial!.opacity += 0.05;
        //         cube!.visible = false;
        //     }
                
		// }


        // if(  Math.abs(camera!.position.z) < 3000 ){
        //     console.log(camera!.position.z)
        //     plane!.visible = false;
		// 	// if( galacticShaderMaterial!.opacity > 0 )
		// 	// 	galacticShaderMaterial!.opacity -= 0.05;
		// }
		// else{
        //     plane!.visible = true;
		// 	// if( galacticShaderMaterial!.opacity < 1 )
		// 	// 	// galacticShaderMaterial!.opacity += 0.05;
        //     //     plane!.opacity += 0.05;
		// }

        

        // if( galacticShaderMaterial!.opacity <= 0.0 ){
        //     console.log("galacticShaderMaterial", false);
		// 	// pGalacticSystem.visible = false;
		// 	plane!.visible = false;						
		// }
		// else{
        //     console.log("galacticShaderMaterial", true);
		// 	// pGalacticSystem.visible = true;
		// 	plane!.visible = true;			
		// }
        // const attributes = geometry.attributes;

        // for (let i = 0; i < attributes.size.array.length; i++) {

        //     attributes.size.array[i] = 14 + 13 * Math.sin(0.1 * i + time);

        // }

        // attributes.size.needsUpdate = true;

        // @ts-ignore
        renderer!.render(scene, camera);
        controls!.update();

    }

    useEffect(() => {
        init();
        animate();
    }, []);


    return <div id="container"></div>;





}




/**
 * 
 * 
 * 1. authorize link
 * 
 * 2. visit link
 * 
 * 
 * 3. callback -> 前端地址 -> code + addr -> 后端走不通
 * 
 * 
 * 
 * 
 * 
 */