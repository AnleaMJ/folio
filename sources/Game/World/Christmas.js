import { attribute, float, Fn, luminance, mix, uniform, vec4 } from 'three/tsl'
import { Game } from '../Game.js'
import * as THREE from 'three/webgpu'
import { smoothstep } from '../utilities/maths.js'

export class Christmas
{
    constructor()
    {
        this.game = Game.getInstance()
        
        this.setTree()
        this.setGifts()
        this.setEmissiveMaterial()

        this.game.time.events.on('tick', () =>
        {
            this.update()
        })
    }

    setTree()
    {
        this.game.entities.addFromModels(
            this.game.resources.christmasTreePhysicalModel.scene,
            this.game.resources.christmasTreeVisualModel.scene,
            {
                type: 'fixed',
                friction: 0
            }
        )
    }

    setGifts()
    {
        const originalModel = this.game.resources.christmasGiftVisualModel.scene
        this.game.materials.updateObject(originalModel)

        originalModel.traverse(child =>
        {
            child.castShadow = true
            child.receiveShadow = true
        })
        
        for(const instance of this.game.resources.christmasGiftInstancesModel.scene.children)
        {
            const newModel = originalModel.clone()
            newModel.scale.copy(instance.scale)

            this.game.entities.add(
                {
                    type: 'dynamic',
                    position: instance.position,
                    friction: 0.4,
                    rotation: instance.quaternion,
                    colliders: [
                        { shape: 'cuboid', parameters: [ instance.scale.x, instance.scale.x, instance.scale.x ], position: { x: 0, y: 0, z: 0 } },
                    ],
                    canSleep: false,
                },
                newModel
            )
        }
    }

    setEmissiveMaterial()
    {
        this.emissiveMaterial = new THREE.MeshLambertNodeMaterial()
        this.emissiveIntensity = uniform(float(0))

        // Shadow receive
        const totalShadows = this.game.materials.getTotalShadow(this.emissiveMaterial)

        // Output
        this.emissiveMaterial.outputNode = Fn(() =>
        {
            const baseColor = attribute('color')

            const lightOutputColor = this.game.materials.lightOutputNodeBuilder(baseColor, totalShadows, false, false)

            const emissiveColor = baseColor.div(luminance(baseColor)).mul(2)
            return mix(lightOutputColor, emissiveColor, this.emissiveIntensity)
        })()

        const object = this.game.resources.christmasTreeVisualModel.scene.getObjectByName('emissive')
        object.receiveShadow = false
        object.material = this.emissiveMaterial
    }

    update()
    {
        const intensityStart = smoothstep(this.game.cycles.day.progress, 0.25, 0.4)
        const intensityEnd = smoothstep(this.game.cycles.day.progress, 0.75, 0.6)

        this.emissiveIntensity.value = Math.min(intensityStart, intensityEnd)
    }
}