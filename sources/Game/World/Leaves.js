import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { attribute, color, float, Fn, hash, instancedArray, instanceIndex, materialNormal, max, min, mod, normalGeometry, normalWorld, positionGeometry, rotate, rotateUV, sin, smoothstep, step, storage, texture, transformNormalToView, uniform, vec2, vec3, vec4 } from 'three/tsl'
import { normalLocal } from 'three/tsl'
import { normalView } from 'three/tsl'

export class Leaves
{
    constructor()
    {
        this.game = Game.getInstance()

        this.count = 1024 * 2 * 2 * 2

        this.setGeometry()
        this.setMaterial()
        this.setMesh()

        this.game.time.events.on('tick', () =>
        {
            this.update()
        })
    }

    setGeometry()
    {
        this.geometry = new THREE.PlaneGeometry(1, 1)

        const positionsArray = this.geometry.attributes.position.array

        positionsArray[0] += 0.15
        positionsArray[3] += 0.15
        positionsArray[6] -= 0.15
        positionsArray[9] -= 0.15

        this.geometry.rotateX(- Math.PI * 0.5)
    }

    setMaterial()
    {
        this.material = new THREE.MeshLambertNodeMaterial({ side: THREE.DoubleSide })

        this.center = uniform(vec2())
        this.vehicleVelocity = uniform(vec3())
        this.vehiclePosition = uniform(vec3())
        this.scale = uniform(0.25)

        // Buffers
        this.positionBuffer = instancedArray(this.count, 'vec3')
        this.velocityBuffer = instancedArray(this.count, 'vec3')
        this.velocityBuffer = instancedArray(this.count, 'vec3')

        // Base rotation buffer
        const baseRotationArray = new Float32Array(this.count)
        for(let i = 0; i < this.count; i++)
            baseRotationArray[i] = Math.random() * Math.PI * 2
        const baseRotationBuffer = storage(new THREE.StorageInstancedBufferAttribute(baseRotationArray, 1), 'float', this.count).toAttribute()
        
        // Scale
        const scaleArray = new Float32Array(this.count)
        for(let i = 0; i < this.count; i++)
            scaleArray[i] = Math.random() * 0.5 + 0.5
        const scaleBuffer = storage(new THREE.StorageInstancedBufferAttribute(scaleArray, 1), 'float', this.count).toAttribute()
        
        // Weight
        const weightArray = new Float32Array(this.count)
        for(let i = 0; i < this.count; i++)
            weightArray[i] = Math.random() * 0.75 + 0.25
        const weightBuffer = storage(new THREE.StorageInstancedBufferAttribute(weightArray, 1), 'float', this.count)

        // Color buffer
        const colorArray = new Float32Array(this.count * 3)
        const colorA = new THREE.Color('#c4c557')
        const colorB = new THREE.Color('#ff782b')
        for(let i = 0; i < this.count; i++)
        {
            const color = colorA.clone().lerp(colorB, Math.random())
            color.toArray(colorArray, i * 3)
        }
        const colorBuffer = storage(new THREE.StorageInstancedBufferAttribute(colorArray, 3), 'vec3', this.count).toAttribute()

        // Normal buffer
        const normalArray = new Float32Array(this.count * 3)
        for(let i = 0; i < this.count; i++)
        {
            const normal = new THREE.Vector3(0, 1, 0)
            normal.applyAxisAngle(new THREE.Vector3(1, 0, 0), (Math.random() - 0.5) * 1.2)
            normal.applyAxisAngle(new THREE.Vector3(0, 0, 1), (Math.random() - 0.5) * 1.2)
            normal.toArray(normalArray, i * 3)
        }
        const normalBuffer = storage(new THREE.StorageInstancedBufferAttribute(normalArray, 3), 'vec3', this.count).toAttribute()

        // Output color
        this.material.outputNode = this.game.lighting.lightOutputNodeBuilder(colorBuffer, this.game.lighting.addTotalShadowToMaterial(this.material))

        // Position
        this.material.positionNode = Fn(() =>
        {
            // Normal
            materialNormal.assign(normalBuffer)

            // Position
            const leavePosition = this.positionBuffer.toAttribute().toVar()

            const newPosition = positionGeometry.mul(scaleBuffer).mul(this.scale).toVar()

            const rotationMultiplier = max(leavePosition.y, 0)
            
            const rotationZ = sin(leavePosition.x.mul(8)).mul(rotationMultiplier)
            const rotationX = sin(leavePosition.z.mul(8)).mul(rotationMultiplier)
            const rotationY = baseRotationBuffer

            newPosition.xy.assign(rotateUV(newPosition.xy, rotationZ, vec2(0)))
            newPosition.yz.assign(rotateUV(newPosition.yz, rotationX, vec2(0)))
            newPosition.xz.assign(rotateUV(newPosition.xz, rotationY, vec2(0)))

            return newPosition.add(leavePosition)
        })()

        this.size = float(this.game.view.optimalArea.radius * 2)

        // Init
        const init = Fn(() =>
        {
            // Position
            const position = this.positionBuffer.element(instanceIndex)
            
            position.assign(vec3(
                hash(instanceIndex).sub(0.5).mul(this.size),
                0,
                hash(instanceIndex.add(1)).sub(0.5).mul(this.size)
            ))
            
            // // Velocity
            // const velocity = this.velocityBuffer.element(instanceIndex)
        })()
        const initCompute = init.compute(this.count)

        this.game.rendering.renderer.computeAsync(initCompute)

        // Update
        const update = Fn(() =>
        {
            const position = this.positionBuffer.element(instanceIndex)
            const velocity = this.velocityBuffer.element(instanceIndex)
            const weight = weightBuffer.element(instanceIndex)

            // Terrain
            const terrainUv = this.game.terrainData.worldPositionToUvNode(position.xz)
            const terrainData = this.game.terrainData.terrainDataNode(terrainUv)
            
            // Vehicle
            const vehicleDelta = position.sub(this.vehiclePosition)
            const distanceToVehicle = vehicleDelta.length()
            const distanceMultiplier = distanceToVehicle.remapClamp(0.5, 2, 1, 0)
            const speedMultiplier = this.vehicleVelocity.length()
            const direction = vehicleDelta.normalize().mul(0.1)
            const velocityFromVehicle = vec3(
                this.vehicleVelocity.x.add(direction.x),
                0,
                this.vehicleVelocity.z.add(direction.z)
            ).mul(speedMultiplier).mul(distanceMultiplier).mul(0.5)

            velocity.addAssign(velocityFromVehicle)

            // Wind
            const noiseUv = position.xz.mul(0.005).add(this.game.wind.direction.mul(this.game.wind.localTime)).xy
            const noise = smoothstep(0.4, 1, texture(this.game.noises.texture, noiseUv).r)

            const windStrength = this.game.wind.strength.sub(float(weight)).max(0).mul(noise)
            velocity.x.addAssign(this.game.wind.direction.x.mul(windStrength).mul(0.002))
            velocity.z.addAssign(this.game.wind.direction.y.mul(windStrength).mul(0.002))
            
            // Fly
            velocity.y = velocity.xz.length().mul(0.2) // Upward

            // Damping
            const inTheAir = step(0.05, position.y)
            const damping = max(terrainData.b.remapClamp(0.4, 0, 0.005, 0.02), inTheAir.mul(0.02))
            velocity.mulAssign(float(1).sub(damping))

            // Gravity
            velocity.y = velocity.y.add(-0.01)

            // Apply velocity
            position.addAssign(velocity)

            // Clamp to floor / water
            const floorY = terrainData.b.remapClamp(0.02, 0.13, 0, -0.3).add(0.03)
            position.y.assign(max(position.y, floorY))

            // Loop
            const halfSize = this.size.mul(0.5).toVar()
            position.x.assign(mod(position.x.add(halfSize).sub(this.center.x), this.size).sub(halfSize).add(this.center.x))
            position.z.assign(mod(position.z.add(halfSize).sub(this.center.y), this.size).sub(halfSize).add(this.center.y))
        })()
        this.updateCompute = update.compute(this.count)
    }

    setMesh()
    {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.count = this.count
        this.mesh.frustumCulled = false
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        this.game.scene.add(this.mesh)
    }

    update()
    {
        this.center.value.set(this.game.view.optimalArea.position.x, this.game.view.optimalArea.position.z)

        this.vehicleVelocity.value.copy(this.game.vehicle.velocity)
        this.vehiclePosition.value.copy(this.game.vehicle.position)
        this.game.rendering.renderer.computeAsync(this.updateCompute)
    }
}