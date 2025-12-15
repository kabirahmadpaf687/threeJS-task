import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 1.5, 6)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    mountRef.current.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)

    let robot: THREE.Object3D | null = null

    const loader = new GLTFLoader()
    loader.load('/robot.glb', (gltf) => {
  robot = gltf.scene
  robot.rotation.y = Math.SQRT2
  if (!robot) return

  
  const box = new THREE.Box3().setFromObject(robot)
  const center = box.getCenter(new THREE.Vector3())

  robot.position.sub(center) 
  robot.position.y -= box.min.y

  robot.scale.setScalar(0.75)

  scene.add(robot)
})


    let mouseX = 0
    let mouseY = 0

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1
    }

    let scale = 0.75
    const onWheel = (e: WheelEvent) => {
      if (!robot) return
      scale += e.deltaY * -0.002
      scale = THREE.MathUtils.clamp(scale, 0.4, 1.2)
      robot.scale.setScalar(scale)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('wheel', onWheel)

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()

    const animate = () => {
      requestAnimationFrame(animate)
      const delta = clock.getDelta()

      if (robot) {
        const maxTilt = 0.85 

        robot.rotation.y = THREE.MathUtils.damp(
          robot.rotation.y,
          mouseX * maxTilt,
          6,
          delta
        )

        robot.rotation.x = THREE.MathUtils.damp(
          robot.rotation.x,
          mouseY * -maxTilt,
          6, 
          delta 
        )
        // robot.rotation.z = THREE.MathUtils.damp(
        //   robot.rotation.x,
        //   mouseY * maxTilt,
        //   6,
        //   delta
        // )
         
      }

      renderer.render(scene, camera)
    }

    animate()

    
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', onResize)
      mountRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
}
