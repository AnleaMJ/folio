import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { color, float, Fn, mix, normalWorld, positionGeometry, step, storage, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { InteractiveAreas } from '../InteractiveAreas2.js'

export class Bonfire
{
    constructor(position, interactiveAreaPosition, hashes)
    {
        this.game = Game.getInstance()

        this.position = position
        this.interactiveAreaPosition = interactiveAreaPosition
        this.hashes = hashes

        this.setParticles()
        this.setInteractiveArea()
        this.setHashes()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    setParticles()
    {
        const emissiveMaterial = this.game.materials.getFromName('emissiveGradientWarm')

        const count = 30
        const elevation = uniform(5)
        const positions = new Float32Array(count * 3)
        const scales = new Float32Array(count)

        this.localTime = uniform(0)

        for(let i = 0; i < count; i++)
        {
            const i3 = i * 3

            const angle = Math.PI * 2 * Math.random()
            const radius = Math.pow(Math.random(), 1.5) * 1
            positions[i3 + 0] = Math.cos(angle) * radius
            positions[i3 + 1] = Math.random()
            positions[i3 + 2] = Math.sin(angle) * radius

            scales[i] = 0.02 + Math.random() * 0.06
        }
        
        const positionAttribute = storage(new THREE.StorageInstancedBufferAttribute(positions, 3), 'vec3', count).toAttribute()
        const scaleAttribute = storage(new THREE.StorageInstancedBufferAttribute(scales, 1), 'float', count).toAttribute()

        const material = new THREE.SpriteNodeMaterial()
        material.colorNode = emissiveMaterial.colorNode

        const progress = float(0).toVar()

        material.positionNode = Fn(() =>
        {
            const newPosition = positionAttribute.toVar()
            progress.assign(newPosition.y.add(this.localTime.mul(newPosition.y)).fract())

            newPosition.y.assign(progress.mul(elevation))
            newPosition.xz.addAssign(this.game.wind.direction.mul(progress))

            const progressHide = step(0.8, progress).mul(100)
            newPosition.y.addAssign(progressHide)
            
            return newPosition
        })()
        material.scaleNode = Fn(() =>
        {
            const progressScale = progress.remapClamp(0.5, 1, 1, 0)
            return scaleAttribute.mul(progressScale)
        })()

        const geometry = new THREE.PlaneGeometry(1, 1)

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.copy(this.position)
        mesh.count = count
        mesh.frustumCulled = true
        this.game.scene.add(mesh)
    }
    
    setInteractiveArea()
    {
        this.game.interactiveAreas.create(
            this.interactiveAreaPosition,
            'Res(e)t',
            InteractiveAreas.ALIGN_RIGHT,
            () =>
            {
                this.game.player.respawn()
            }
        )
    }

    setHashes()
    {
        const material = new THREE.MeshLambertNodeMaterial()

        // Shadow receive
        const totalShadows = this.game.lighting.addTotalShadowToMaterial(material)

        material.outputNode = Fn(() =>
        {
            const baseUv = uv().toVar()

            const baseColor = color('#6F6A87')
            const lightOutput = this.game.lighting.lightOutputNodeBuilder(baseColor, vec3(0, 1, 0), totalShadows, true, false)

            const distanceToCenter = baseUv.sub(0.5).length()

            const voronoi = texture(
                this.game.noises.voronoi,
                baseUv
            ).g

            voronoi.lessThan(distanceToCenter.remap(0, 0.5, 0.3, 0)).discard()

            return lightOutput
        })()

        this.hashes.material = material
    }

    update()
    {
        this.localTime.value += this.game.ticker.deltaScaled * 0.1
    }
}