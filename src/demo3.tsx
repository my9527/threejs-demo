


import { Canvas, useFrame, useThree, extend, PrimitiveProps } from "@react-three/fiber";
import React, { FC, PropsWithChildren, forwardRef, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import * as THREE from "three";

// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from "three/examples/jsm/Addons.js";


// import { OrbitControls } from "three/examples/jsm/Addons.js";
import { FlyControls, OrbitControls, useGLTF } from "@react-three/drei";
import TWEEN, { Easing, Tween } from "@tweenjs/tween.js";
var galacticTexture0 = new THREE.TextureLoader().load("/textures/sprites/galactic_sharp.png");
var galacticTexture1 = new THREE.TextureLoader().load("/textures/sprites/galactic_blur.png");
var cc = new THREE.TextureLoader().load('/textures/sprites/galactictop.png')
cc.anisotropy = 16;

extend({ Line: THREE.Line });


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


const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
var galacticUniforms = {
    color: { type: "c", value: new THREE.Color(0xffffff) },
    texture0: { type: "t", value: galacticTexture0 },
    texture1: { type: "t", value: galacticTexture1 },
    idealDepth: { type: "f", value: 1.0 },
    blurPower: { type: "f", value: 1.0 },
    blurDivisor: { type: "f", value: 2.0 },
    sceneSize: { type: "f", value: 120.0 },
    cameraDistance: { type: "f", value: 800.0 },
    zoomSize: { type: "f", value: 1.0 },
    scale: { type: "f", value: 1.0 },
    heatVision: { type: "f", value: 0.0 },
};

const ClickableArea = React.forwardRef((props: any, ref: any) => {
    const { onClick, pos = [0, 0, 0], size = [100, 100] } = props
    // const { viewport } = useThree();

    return (
        <mesh
            ref={ref}
            rotation={[0, Math.PI / 2, 0]}
            position={pos}

            onClick={onClick}
            visible={false} // Make invisible but still clickable
        >
            <planeGeometry args={size} />
            <meshBasicMaterial side={THREE.DoubleSide} />
        </mesh>
    );
})

const CenteredGroup: FC<PropsWithChildren & { onClick?: any }> = ({ children, onClick }) => {
    const groupRef = useRef<any>();
    const clickAreaRef = useRef<any>();

    const [center, updateCenter] = useState<any>();
    const [clickSize, updateClickSize] = useState<any>();


    useEffect(() => {
        const box = new THREE.Box3().setFromObject(groupRef.current);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const size = new THREE.Vector3();
        // box.getSize(size);

        // console.log("box size", size);
        groupRef.current.children.forEach((child: any) => {
            // child.position.sub(center);
            size.addVectors(child.position, new THREE.Vector3(0, 0, 0));
        });
        updateCenter(center);

        console.log('size ----', size);

        updateClickSize(size);

        //   groupRef.current.position.add(center.clone().negate());

        //   clickAreaRef.current.position.copy(groupRef.current.position);

    }, [children]); // Dependency on children to re-calculate when they change

    return <group ref={groupRef}>
        {/* <ClickableArea  ref={clickAreaRef} onClick={() => onClick(new THREE.Vector3(clickSize.x/2, clickSize.y/2, clickSize.z/2))} pos={groupRef.current?.position}  /> */}
        {children}
    </group>;
}




function LineMesh(props: any) {

    const meshsRefs = props.meshes;

    const lineRef = useRef<any>();


    useFrame(() => {
        if (lineRef.current) {
            // Update line geometry to follow the spheres
            const points = meshsRefs.map((meshRef: any) => {
                return meshRef.current.position.clone();
            });

            // points.push(mesh1.current.position.clone());
            // points.push(mesh2.current.position.clone());

            lineRef.current.geometry.setFromPoints(points);
            lineRef.current.geometry.verticesNeedUpdate = true;
        }
    });

    return (

        <line ref={lineRef} width={100} strokeWidth={10}  >
            <bufferGeometry attach="geometry" />
            <lineBasicMaterial attach="material" color="white" linewidth={100} />
        </line>
    )

}


const Model = React.forwardRef((props: PrimitiveProps, ref: any) => {
    const { path, onClick, position } = props
    // const glb: any = useLoader(GLTFLoader, path);
    // @ts-ignore
    const { scene, nodes, materials } = useGLTF(path);

    console.log("useGLTF", scene, nodes, materials)
    // const { scene } = glb;
    const [hovered, setHover] = useState(false);

    const targetScene = useMemo(() => {
        const clone = scene.clone();
        clone.traverse((child: any) => {
        if (child.isMesh) {
            child.material = child.material.clone();
        }
        });
        return clone;
    }, [scene])

    useFrame(() => {
        const time = Date.now() * 0.005;
        targetScene.rotation.z = -0.01 * time;

        // const color = new THREE.Color();
        // targetScene?.color.lerp(color.set(hovered ? 'red' : 'white'), hovered ? 1 : 0.1)
        
    });

    const [center, updateCenter] = useState<any>(null);

    useEffect(() => {
        const box = new THREE.Box3().setFromObject(targetScene);
        const center = box.getCenter(new THREE.Vector3());
        updateCenter(center);
    }, [path, targetScene]);

    return <primitive
                onPointerOver={(e: any) => (e.stopPropagation(), setHover(true))} 
                onPointerOut={(e: any) => setHover(false)} 
                ref={ref} 
                object={targetScene} 
                scale={10} 
                
                onClick={() => onClick(position[0], position[1], position[2])} position={position} 
            />;
});




const Scene = ({ handleBack }: { handleBack?: any}) => {


    // const sceneRef = useRef(null);
    const ball = useRef(null);
    const controlRef = useRef<any>(null);
    const { camera } = useThree();
    const modelRef = useRef<any>(null);
    const axesRef = useRef<any>(null);
    const [positionState, updatePositionState] = useState<any>([]);

    const bufferAttributes = useMemo(() => {

        const amount = 100000;
        var count = 100000;
        var numArms = 5;
        var arm = 0;
        var countPerArm = count / numArms;
        var ang = 0;
        var dist = 0;

        let maxX = 0;
        let minZ = 0;
        const vertex = new THREE.Vector3();

        const positions = new Float32Array(amount * 3);
        const colors = new Float32Array(amount * 3);

        const sizes = new Float32Array(amount);
        const color = new THREE.Color(0xffffff);

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
            // vertex.x = x;
            // // vertex.y = (Math.random() * 2 - 1) * radius;
            // vertex.y = y;
            // // vertex.z = (Math.random() * 2 - 1) * radius;
            // vertex.z = z;
            vertex.x = x;
            // vertex.y = (Math.random() * 2 - 1) * radius;
            vertex.y = z;
            // vertex.z = (Math.random() * 2 - 1) * radius;
            vertex.z = y;
            vertex.toArray(positions, i * 3);

            // color.setHSL( 0.6, 0.75, 0.25 + vertex.y / ( 2 * radius ) );
            color.setHSL(0.5 + 0.1 * (i / amount), 0.7, 1);
            // if ( vertex.x < 0 ) {

            //     color.setHSL( 0.5 + 0.1 * ( i / amount ), 0.7, 0.5 );

            // } else {

            //     color.setHSL( 0.0 + 0.1 * ( i / amount ), 0.9, 0.5 );

            // }
            color.toArray(colors, i * 3);

            let _size = 200 + constrain(600 / dist, 0, 32000);
            if (Math.random() > 0.99) {
                _size *= Math.pow(1 + Math.random(), 3 + Math.random() * 3) * .9;
            } else {
                if (Math.random() > 0.7) {
                    _size *= 1 + Math.pow(1 + Math.random(), 2) * .04;
                }

                if (i == 0) {
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

            if (i % countPerArm == 0) {
                ang = Math.PI * 2 / numArms * arm;
                dist = 0;
                arm++;
            }

        }

        return {
            positions,
            colors,
            sizes
        }

    }, []);


    console.log("bufferAttributes.positions", bufferAttributes.positions);

    const cameraRef = useRef(camera);
    const targetRef = useRef(null);

    const positionRef = useRef<number[] | null>(null);

    const getClose = useCallback(() => {
        if (ball.current) {
            console.log("ball clicked");
            targetRef.current = ball.current;
            // camera.lookAt(ball.current);
            // const pos = ball.current.
        }
    }, []);


    // @ts-ignore
    window.lookAt = (x: number, y: number, z: number) => {
        cameraRef.current.lookAt(x, y, z);
    }

    const handleCenter = (center: any) => {
        positionRef.current = [];
        // controlRef.current.target.copy(center);
        positionRef.current = [center.x, center.y, center.z];
        // camera.lookAt(center);
        // controlRef.current.update();
    };

    // useEffect(()=>{
    //     setTimeout(() => {
    //         positionRef.current = [2000, 1000, 1000 ]
    //     }, 1000)
    // }, []);

    const mesh1Ref = useRef<any>();
    const mesh2Ref = useRef<any>();

    useEffect(() => {
        document.addEventListener('back_three', () => {
            // positionRef.current =[0, 0, 1000];
            // updatePositionState([0, 0, 1000]);
            const curPos = cameraRef.current.position;
            cameraRef.current.lookAt(0, 0, 0);
            new Tween(curPos)
                .to(new THREE.Vector3(0, 0, 1000), 2000) // Move to (2, 2, 0) in 2000 milliseconds
                .onUpdate((pos) => {
                    console.log("update", pos);
                    cameraRef.current.position.set(pos.x, pos.y, pos.z);
                    controlRef.current.target =new THREE.Vector3(pos.x, pos.y, 0);
                    controlRef.current.update();
                    // Update the cube's position
                    // controlRef.current.target = pos;
                    // controlRef.current.update();
                    // cameraRef.current.position.set(positionStart.x, positionStart.y, positionStart.z);
                })
                .easing(Easing.Quartic.InOut)
                // .easing(TWEEN.Easing.Quartic.In)
                .start();
        });
    }, []);

    useEffect(() => {
        // cameraRef.current.position.set(100, 0, 0);
        if (cameraRef.current) {
            new Tween([0, 0, 90000])
                .to([0, 0, 1000], 2000) // Move to (2, 2, 0) in 2000 milliseconds
                .onUpdate((pos) => {
                    console.log("update", pos);
                    cameraRef.current.position.set(pos[0], pos[1], pos[2]);
                    // Update the cube's position
                    // controlRef.current.target = pos;
                    // controlRef.current.update();
                    // cameraRef.current.position.set(positionStart.x, positionStart.y, positionStart.z);
                })
                .easing(Easing.Quartic.InOut)
                // .easing(TWEEN.Easing.Quartic.In)
                .start();
        }

    }, [cameraRef.current]);

    useEffect(() => {
        if(axesRef.current) {
            axesRef.current.setColors(new THREE.Color( 0xff0000 ), new THREE.Color( 0x00ff00 ), new THREE.Color( 0xff0000 ));
        }
    }, [axesRef.current]);

    useEffect(() => {
        if (positionRef.current && positionRef.current.length && controlRef.current) {
            const aVectors = new THREE.Vector3(positionRef.current[0] + 10, positionRef.current[1], 30);
            
            const distance = cameraRef.current.position.distanceTo(aVectors);
            // cameraRef.current.target.position.lerp(targetPosition.current, 0.05);
            if (aVectors.equals(controlRef.current.target) || distance < 0.1) {
                // if(positionRef.current.length) {
                //     console.log("==========>>>>111111")
                //     cameraRef.current.lookAt(aVectors.x, aVectors.y, 0);
                //     cameraRef.current.position.set(aVectors.x, aVectors.y, aVectors.z);
                //     controlRef.current.target.lerp(aVectors, 0.05);
                //     controlRef.current.update();
                // }
                positionRef.current = [];

            } else {

                new Tween(cameraRef.current.position)
                .to(new THREE.Vector3(aVectors.x, aVectors.y, aVectors.z), 2000) // Move to (2, 2, 0) in 2000 milliseconds
                .onUpdate((pos) => {
                    console.log("update", pos);
                    cameraRef.current.position.set(pos.x, pos.y, pos.z);
                    controlRef.current.target =new THREE.Vector3(pos.x, pos.y, 0);
                    controlRef.current.update();
                    // Update the cube's position
                    // controlRef.current.target = pos;
                    // controlRef.current.update();
                    // cameraRef.current.position.set(positionStart.x, positionStart.y, positionStart.z);
                })
                .easing(Easing.Quartic.InOut)
                .onComplete(() => {
                    positionRef.current = [];
                })
                // .easing(TWEEN.Easing.Quartic.In)
                .start();
                
                
                // if(distance > 10) {
                //     const bVectors = new THREE.Vector3().subVectors(cameraRef.current.position, aVectors).normalize();

                //     const selectedPosition = bVectors.multiplyScalar(distance * 0.9);
                //     cameraRef.current.position.lerp(selectedPosition, 0.05);
                // }
                // cameraRef.current.position.lerp(new THREE.Vector3(0, aVectors.y, aVectors.z), 0.05);
                // cameraRef.current.lookAt(aVectors.x, aVectors.y, 0);
                // controlRef.current.target.lerp(new THREE.Vector3(aVectors.x, aVectors.y, 0), 0.05);
                // controlRef.current.update();
            }

        }
    }, [positionRef.current]);

    useFrame(() => {

        
        TWEEN.update();
        // if(positionRef.current && positionRef.current.length && !!controlRef.current) {
        //     const target = new THREE.Vector3(positionRef.current[0], positionRef.current[1], positionRef.current[2]);
        //     // const direction = new THREE.Vector3().subVectors(target, new THREE.Vector3(0, 0, 0)).normalize();
        //     const direction = new THREE.Vector3().subVectors(target, new THREE.Vector3(0, 0, 0));
        //     console.log("direction", direction);
        //     // const selectedPosition = new THREE.Vector3(x, y ,z);
        //     const selectedPosition = new THREE.Vector3(direction.x * 10, direction.y * 10, direction.z  * 10);

        //     // @ts-ignore
        //     controlRef.current.target.lerp(selectedPosition, 1);
        //     cameraRef.current.lookAt(positionRef.current[0], positionRef.current[1], positionRef.current[2]);

        //     // controlRef.current.target = selectedPosition;
        //     // @ts-ignore
        //     controlRef.current.update();
        //     // @ts-ignore


        //     positionRef.current = null;

        // }
    })

    const ligthTarget = useMemo(() => {
        const tar = new THREE.Object3D();
        tar.position.set(-1000, -1000, 50);
        return tar;
    }, []);

    const isDrag = useRef(false);
    const [, startTransition] = useTransition();

    useEffect(() => {

        let startX = 0;
        let startY = 0;
        window.addEventListener("mousedown", (e) => {
            startX = e.clientX;
            startY = e.clientY;
            isDrag.current = true;
            document.querySelector('#three_canvas')?.classList.add("dragging");
        });

        window.addEventListener("mouseup", (e) => {
            isDrag.current = false;
            document.querySelector('#three_canvas')?.classList.remove("dragging");
        })
        window.addEventListener("mousemove", (event) => {

            if(!isDrag.current) return;
            startTransition(() => {
                let targetX = (event.clientX - startX) / 2;
                let targetY = -1*(event.clientY - startY) / 2;
                
                const vector = new THREE.Vector3(0, 0, -1); // Default looking direction in camera space
                vector.applyQuaternion(cameraRef.current.quaternion);  // Apply rotation
                vector.add(cameraRef.current.position);
                cameraRef.current.lookAt(new THREE.Vector3().addVectors(vector, new THREE.Vector3(targetX, targetY, 0)))
    
                cameraRef.current.position.x += targetX;
                cameraRef.current.position.y += targetY;
                // cameraRef.current.position.lerp(new THREE.Vector3().addVectors(cameraRef.current.position, new THREE.Vector3(targetX, targetY, 0)), 0.05);
                
                if(controlRef.current?.target) {
                    controlRef.current.target = new THREE.Vector3().addVectors(controlRef.current.target, new THREE.Vector3(targetX, targetY, 0));
                    controlRef.current.update();
                }

                startX = event.clientX;
                startY = event.clientY;
            });
            
        })
    }, []);

    // useFrame(() => {
    //     if (positionRef.current) {

    //         console.log("positionRef.current", positionRef.current);
    //         // @ts-ignore
    //         // cameraRef.current.lookAt(positionRef.current[0],positionRef.current[1],positionRef.current[2] );
    //         // positionRef.current = null;
    //         //@ts-ignore
    //         // @ts-ignore
    //         const direction = new THREE.Vector3().subVectors(new THREE.Vector3(positionRef.current[0], positionRef.current[1], positionRef.current[2]), new THREE.Vector3(0, 0, 0)).normalize();
    //         const selectedPosition = new THREE.Vector3(positionRef.current[0], positionRef.current[1], positionRef.current[2]);
    //         if (camera.position.distanceTo(selectedPosition) > 100) {
    //             const step = 0.05;
    //             // const target = 
    //             // @ts-ignore
    //             cameraRef.current.lookAt(positionRef.current);
    //             cameraRef.current.position.lerp(new THREE.Vector3(direction.x + 1, direction.y + 1, direction.z + 1), step);
    //         } else {
    //             // console.log("")
    //             // @ts-ignore
    //             cameraRef.current.lookAt(positionRef.current);
    //             positionRef.current = null; //
    //         }

    //         // // // cameraRef.current.lookAt(selectedPosition); 
    //         // if (camera.position.distanceTo(selectedPosition) < 101) {
    //         //     positionRef.current = null; // Stop the camera when it's close enough
    //         // }
    //     }
    // });



    return (

        <>
            <points position={[0, 0, 0]} >
                <bufferGeometry attach="geometry" >
                    <bufferAttribute itemSize={3} attach="attributes-position" count={bufferAttributes.positions.length / 3} array={bufferAttributes.positions}></bufferAttribute>
                    <bufferAttribute itemSize={3} attach="attributes-customColor" count={bufferAttributes.colors.length / 3} array={bufferAttributes.colors}  ></bufferAttribute>
                    <bufferAttribute itemSize={1} attach="attributes-size" count={bufferAttributes.sizes.length} array={bufferAttributes.sizes}  ></bufferAttribute>
                </bufferGeometry>
                <shaderMaterial uniforms={{
                    color: {
                        value: new THREE.Color(0xffffff),
                    },
                    pointTexture: {
                        value: new THREE.TextureLoader().load('textures/sprites/spark1.png')
                    }
                }}
                    depthTest={false}
                    transparent
                    blending={THREE.AdditiveBlending}
                    vertexShader={document.getElementById('vertexshader')!.textContent as string}
                    fragmentShader={document.getElementById('fragmentshader')!.textContent as string}
                >

                </shaderMaterial>
            </points>
            <CenteredGroup
            //  onClick={(center: any) => {
            //     positionRef.current = [center.x, center.y, center.z];
            //     console.log("CenteredGroup click", center)
            // }}
            >
                {/* <mesh ref={mesh1Ref} onClick={() => positionRef.current = [0, 10, 100]} position={[0, 10, 20]}>
                    <sphereGeometry args={[1, 100]}></sphereGeometry>
                    <meshBasicMaterial color={new THREE.Color(0xff4d4d)}></meshBasicMaterial>

                </mesh>
                <mesh ref={mesh2Ref} onClick={() => positionRef.current = [0, 5, 56]} position={[0, 5, 36]}>
                    <sphereGeometry args={[1, 100]}></sphereGeometry>
                    <meshBasicMaterial color={new THREE.Color(0xff4d4d)}></meshBasicMaterial>
                </mesh> */}

                <Model
                    onCenter={handleCenter}
                    ref={modelRef}
                    onClick={(...center: number[]) => {
                        positionRef.current = center;
                        updatePositionState(center);
                    }}
                    path="/textures/sprites/Planets1-z.glb"
                    position={[100, 230, 10]}
                />
                <Model
                    onCenter={handleCenter}
                    ref={mesh1Ref}
                    onClick={(...center: number[]) => {
                        positionRef.current = center;
                        updatePositionState(center);
                    }}
                    path="/textures/sprites/Planets1-z.glb"
                    position={[0, 100, 10]}
                />
                <Model
                    onCenter={handleCenter}
                    ref={mesh2Ref}
                    onClick={(...center: number[]) => {
                        positionRef.current = center;
                        updatePositionState(center);
                    }}
                    path="/textures/sprites/Planets1-z.glb"
                    position={[450, 150, 10]}
                />
            </CenteredGroup>

            {/* <Model onClick={() => positionRef.current = [0, 0, 0]} path="/textures/sprites/1.glb" position={[0, 0, 0]} /> */}
            {/* <mesh  onClick={() => positionRef.current = [4, 0, 0]} position={[4, 5, 6]}>
                <sphereGeometry args={[2, 100]}></sphereGeometry>
               
            </mesh> */}


            <LineMesh meshes={[ mesh1Ref, modelRef, mesh2Ref]} />

            {/* <Model path="/textures/sprites/2.glb" key="3"  position={[3, 0, 0 ]}  /> */}
            {/* <Model path="/textures/sprites/1.glb"  position={[0, 1, 1 ]}  /> */}
            {/* <mesh onClick={() => positionRef.current = [  8000, 3000, 100 ]} position={[ 8000, 3000, 100 ]}>
                    <sphereGeometry args={[ 1000, 10, 10 ]}></sphereGeometry>
                    <meshBasicMaterial color={new THREE.Color(0x3333ff)}></meshBasicMaterial>
                </mesh> */}
            <OrbitControls ref={controlRef} enableRotate={false}  enablePan={true} 
                onChange={(e) => console.log("Controls Changed", e)}
                onEnd={(e) => console.log("Interaction Ended", e)}
                onStart={() => console.log("triiger start")}
            />

            {/* <FlyControls 
                ref={controlRef}
                movementSpeed={50}
                dragToLook={true}
                autoForward={false}
                object={cameraRef.current}
                // rollSpeed={Math.PI / 12}
            /> */}
            {/* <axesHelper ref={axesRef}  args={[5000]} /> */}
            {/* <gridHelper args={[50, 50, 50]} /> */}

            {/* <ambientLight intensity={0.5} /> */}
            <directionalLight 
                color={'white'}       // Color of the light
                intensity={1}         // Strength of the light
                position={[1000, 1000, 1000]}  // Position from where the light hits the scene
                // castShadow            // Optional: if you want the light to cast shadows
                shadow-mapSize-width={1024}  // Optional: define shadow resolution
                shadow-mapSize-height={1024} // Optional: define shadow resolution
                shadow-camera-near={0.5}     // Optional: near plane of the shadow camera
                shadow-camera-far={90000} 
                target={ligthTarget}
            
            />
            {/* <pointLight color={new THREE.Color(0xffffff)} intensity={0.5} position={[-1, 1, -1]} castShadow /> */}
            {/* <directionalLightHelper  color={new THREE.Color(0xffffff)} light={new THREE.DirectionalLight(new THREE.Color(0xffffff))} /> */}
            {/* <hemisphereLight color={0x404040} /> */}
        </>

    );
}


export default ({ handleBack}: { handleBack?: any}) => {
    return (
        <Canvas
            id="three_canvas"
            onCreated={({ gl }) => {
                gl.setClearColor("#000000")
            }}
            gl={{ pixelRatio: window.devicePixelRatio }}



            camera={{ position: [0, 0, 90000], fov: 40, far: 900000, near: 20, aspect: WIDTH / HEIGHT }}
        >
            <Scene />
        </Canvas>
    );
}
