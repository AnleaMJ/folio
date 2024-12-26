import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import getWind from '../tsl/getWind.js'
import { color, float, Fn, instance, instancedBufferAttribute, instanceIndex, luminance, mix, positionLocal, texture, uniform, uniformArray, uv, vec3, vec4 } from 'three/tsl'
import { remap, smoothstep } from '../utilities/maths.js'

export class Flowers
{
    constructor()
    {
        this.game = Game.getInstance()

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '🌸 Flowers',
                expanded: true,
            })
        }

        this.setColors()
        // this.setOne()
        this.setRandomClusters()
        
        this.setGeometry()
        this.setMaterial()
        this.setInstancedMesh()

        this.game.time.events.on('tick', () =>
        {
            this.update()
        })
    }

    setColors()
    {
        this.colors = {}
        this.colors.presets = [
            new THREE.Color('#ffffff'),
            new THREE.Color('#ff7dc7'),
            new THREE.Color('#ffab67'),
            new THREE.Color('#4183ff'),
            new THREE.Color('#ccff7a'),
        ]

        this.colors.array = []

        for(const _preset of this.colors.presets)
        {
            if(this.game.debug.active)
                this.game.debug.addThreeColorBinding(this.debugPanel, _preset, 'color').on('change', () => { this.colors.updateArray() })
        }

        this.colors.updateArray = () =>
        {
            let i = 0
            for(const _preset of this.colors.presets)
            {
                _preset.toArray(this.colors.array, i * 3)
                i++
            }
        }

        this.colors.updateArray()

        this.colors.uniform = uniformArray(this.colors.array)

        this.colors.emissiveIntensity = uniform(float(0))
    }

    setOne()
    {
        this.transformMatrices = []
        const object = new THREE.Object3D()
        object.position.set(0, 0.4, 4)
        object.scale.set(1, 1, 1)
        
        object.updateMatrix()

        this.transformMatrices.push(object.matrix)
    }

    setRandomClusters()
    {
        this.transformMatrices = []

        this.colorIndices = []

        for(let i = 0; i < 60; i++)
        {
            const clusterPosition = new THREE.Vector2(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            )

            const colorIndex = i % this.colors.presets.length

            const clusterCount = 2 + Math.floor(Math.random() * 8)
            for(let j = 0; j < clusterCount; j++)
            {
                // Transform matrix
                const size = remap(Math.random(), 0, 1, 0.25, 0.8)

                const object = new THREE.Object3D()
                
                object.rotation.y = Math.PI * 2 * Math.random()

                object.position.set(
                    clusterPosition.x + (Math.random() - 0.5) * 3,
                    size * 0.5,
                    clusterPosition.y + (Math.random() - 0.5) * 3
                )

                object.scale.setScalar(size)
                object.updateMatrix()

                this.transformMatrices.push(object.matrix)

                // Color index
                this.colorIndices.push(colorIndex)
            }
        }
    }

    setGeometry()
    {
        this.geometry = new THREE.SphereGeometry(1, 4, 4, - Math.PI * 0.2, Math.PI * 0.4, Math.PI * 0.3, Math.PI * 0.4)
        this.geometry.rotateZ(- Math.PI * 0.5)
        this.geometry.translate(0, - 0.8, 0)
    }

    setMaterial()
    {
        // this.material = new THREE.MeshLambertNodeMaterial({ wireframe: true })
        this.material = new THREE.MeshLambertNodeMaterial({
            alphaMap: this.game.resources.bushesLeaves,
            alphaTest: 0.01
        })
    
        // Received shadow position
        const shadowOffset = uniform(0.25)
        this.material.shadowPositionNode = positionLocal.add(this.game.lighting.directionUniform.mul(shadowOffset))

        // Position
        const wind = getWind([this.game.resources.noisesTexture, positionLocal.xz])
        const multiplier = positionLocal.y.clamp(0, 1).mul(1)

        this.material.positionNode = Fn( ( { object } ) =>
        {
            instance(object.count, this.instanceMatrix).append()

            return positionLocal.add(vec3(wind.x, 0, wind.y).mul(multiplier))
        })()

        // Shadow receive
        const totalShadows = this.game.materials.getTotalShadow(this.material)

        // Output
        this.material.outputNode = Fn(() =>
        {
            const colorIndex = instancedBufferAttribute(this.instanceColorIndex, 'float', 1)
            const baseColor = vec3(
                this.colors.uniform.element(colorIndex.mul(3).add(0)),
                this.colors.uniform.element(colorIndex.mul(3).add(1)),
                this.colors.uniform.element(colorIndex.mul(3).add(2))
            ).add(float(instanceIndex).mod(5).div(6))

            const lightOutputColor = this.game.materials.lightOutputNodeBuilder(baseColor, totalShadows, true, false)

            const emissiveColor = baseColor.div(luminance(baseColor)).mul(texture(this.game.resources.bushesLeaves, uv()).r.pow(2)).mul(10)
            return mix(lightOutputColor, emissiveColor, this.colors.emissiveIntensity)
        })()
    }

    setInstancedMesh()
    {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        this.mesh.count = this.transformMatrices.length
        this.mesh.frustumCulled = false
        this.game.scene.add(this.mesh)

        this.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(this.mesh.count * 16), 16)
        this.instanceMatrix.setUsage(THREE.StaticDrawUsage)

        this.instanceColorIndex = new THREE.InstancedBufferAttribute(new Float32Array(this.colorIndices), 1)
        this.instanceColorIndex.setUsage(THREE.StaticDrawUsage)
        
        let i = 0
        for(const _transformMatrix of this.transformMatrices)
        {
            _transformMatrix.toArray(this.instanceMatrix.array, i * 16)
            i++
        }
    }

    update()
    {
        const intensityStart = smoothstep(this.game.cycles.day.progress, 0.25, 0.4)
        const intensityEnd = smoothstep(this.game.cycles.day.progress, 0.75, 0.6)

        this.colors.emissiveIntensity.value = Math.min(intensityStart, intensityEnd)
    }
}