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
      1,
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
    let mixer: THREE.AnimationMixer | null = null

    const loader = new GLTFLoader()
    loader.load('/robot.glb', (gltf: { scene: any; animations: string | any[] }) => {
      robot = gltf.scene
      if (!robot) return
      robot.position.set(0, -1.2, 0)
      robot.scale.setScalar(0.75)
      robot.rotation.z = Math.PI-20 

      scene.add(robot)

      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(robot)
        const action = mixer.clipAction(gltf.animations[0])
        action.play()
      }
    })

    const target = new THREE.Vector3()
    const clock = new THREE.Clock()
    
    const raycaster = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

    let cursorX = 0 

    const onMouseMove = (e: MouseEvent) => {
  cursorX = (e.clientX / window.innerWidth) * 2 - 1

  const ndc = new THREE.Vector2(
    cursorX,
    -(e.clientY / window.innerHeight) * 2 + 1
  )

  raycaster.setFromCamera(ndc, camera)
  const intersect = new THREE.Vector3()
  const hit = raycaster.ray.intersectPlane(plane, intersect)
  if (hit) target.copy(intersect)
}


    
    let scale = 0.75
    const onWheel = (e: WheelEvent) => {
      if (!robot) return
     
      scale += e.deltaY * -0.002
      scale = THREE.MathUtils.clamp(scale, 0.1, 1.0)
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

    const animate = () => {
      requestAnimationFrame(animate)

      const delta = clock.getDelta()

      if (robot) {
        robot.position.x = THREE.MathUtils.damp(
          robot.position.x,
          target.x,
          6,
          delta
        )

        robot.position.y = THREE.MathUtils.damp(
          robot.position.y,
          target.y,
          6,
          delta
        )

      }

      if (mixer) mixer.update(delta)

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
