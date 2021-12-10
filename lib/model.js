import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'

export function loadGLTFModel(
    scene,
    glbPath,
    options={reaceiveShadow:true, castShadow:true}
){
    const {reaceiveShadow,castShadow}=options
    return new Promise((resolve,reject)=>{
        const loader =new GLTFLoader()

        loader.load(
            glbPath,
            gltf =>{
                const obj = gltf.scene
                obj.name = 'Totoro'
                obj.position.y = 0
                obj.position.x = 0
                obj.reaceiveShadow=reaceiveShadow
                obj.castShadow=castShadow
                scene.add(obj)

                obj.traverse(function(child){
                    if(child.isMesh){
                        child.castShadow=castShadow
                        child.reaceiveShadow=reaceiveShadow
                    }

                })
                resolve(obj)
            },
            undefined,
            function(error){
                reject(error)
            }
        )
    })
}