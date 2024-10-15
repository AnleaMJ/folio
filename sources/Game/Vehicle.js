import * as THREE from 'three/webgpu'
import { Game } from './Game.js'

export class Vehicle
{
    constructor()
    {
        this.game = new Game()

        this.setChassis()

        this.controller = this.game.physics.world.createVehicleController(this.chassis.physical.body)
        this.up = new THREE.Vector3(0, 1, 0)

        this.setWheels()
        this.setJump()
        this.setReset()

        this.game.time.events.on('tick', () =>
        {
            this.updatePrePhysics()
        }, 1)
        this.game.time.events.on('tick', () =>
        {
            this.updatePostPhysics()
        }, 3)
    }

    setChassis()
    {
        const visual = new THREE.Mesh(
            new THREE.BoxGeometry(1 * 2, 0.5 * 2, 1.5 * 2),
            new THREE.MeshNormalMaterial({ wireframe: true })
        )
        this.game.world.scene.add(visual)
        this.chassis = this.game.physics.addEntity(
            {
                type: 'dynamic',
                shape: 'cuboid',
                position: { x: 0, y: 1, z: 0 },
                colliders: [ { shape: 'cuboid', parameters: [ 1, 0.5, 1.5 ] } ],
                canSleep: false,
                // linearDamping: 0.2
            },
            visual
        )
    }

    setWheels()
    {
        const wheelsSetting = {
            offset: { x: 0.75, y: -0.4, z: 0.8 }, // No default
            directionCs: { x: 0, y: -1, z: 0 },   // Suspension direction
            axleCs: { x: -1, y: 0, z: 0 },        // Rotation axis
            frictionSlip: 20,             // 10.5
            maxSuspensionForce: 6000,    // 6000
            maxSuspensionTravel: 5,      // 5
            radius: 0.5,                 // No default
            sideFrictionStiffness: 0.6,  // 1
            suspensionCompression: 2,    // 0.83
            suspensionRelaxation: 1.88,  // 0.88
            suspensionRestLength: 0.125, // No default
            suspensionStiffness: 30,     // 5.88
        }
        const wheelsPositions = [
            new THREE.Vector3(  wheelsSetting.offset.x, wheelsSetting.offset.y,   wheelsSetting.offset.z),
            new THREE.Vector3(  wheelsSetting.offset.x, wheelsSetting.offset.y, - wheelsSetting.offset.z),
            new THREE.Vector3(- wheelsSetting.offset.x, wheelsSetting.offset.y,   wheelsSetting.offset.z),
            new THREE.Vector3(- wheelsSetting.offset.x, wheelsSetting.offset.y, - wheelsSetting.offset.z),
        ]

        this.wheels = {}
        this.wheels.items = []
        this.wheels.engineForce = 0
        this.wheels.steering = 0
        this.wheels.visualSteering = 0
        this.wheels.inContact = 0

        for(let i = 0; i < 4; i++)
        {
            const basePosition = wheelsPositions[i]
            this.controller.addWheel(basePosition, wheelsSetting.directionCs, wheelsSetting.axleCs, wheelsSetting.suspensionRestLength, wheelsSetting.radius)

            // Don't change
            // this.controller.setWheelAxleCs(i, wheelsSetting.axleCs)
            // this.controller.setWheelDirectionCs(i, wheelsSetting.directionCs)

            // Player controlled
            // this.controller.setWheelBrake(i, )
            // this.controller.setWheelEngineForce(i, )
            // this.controller.setWheelSteering(i, )

            // Can be tweaked
            this.controller.setWheelChassisConnectionPointCs(i, basePosition)
            this.controller.setWheelFrictionSlip(i, wheelsSetting.frictionSlip)
            this.controller.setWheelMaxSuspensionForce(i, wheelsSetting.maxSuspensionForce)
            this.controller.setWheelMaxSuspensionTravel(i, wheelsSetting.maxSuspensionTravel)
            this.controller.setWheelRadius(i, wheelsSetting.radius)
            this.controller.setWheelSideFrictionStiffness(i, wheelsSetting.sideFrictionStiffness)
            this.controller.setWheelSuspensionCompression(i, wheelsSetting.suspensionCompression)
            this.controller.setWheelSuspensionRelaxation(i, wheelsSetting.suspensionRelaxation)
            this.controller.setWheelSuspensionRestLength(i, wheelsSetting.suspensionRestLength)
            this.controller.setWheelSuspensionStiffness(i, wheelsSetting.suspensionStiffness)

            // Visual
            const visual = new THREE.Mesh(
                new THREE.CylinderGeometry(wheelsSetting.radius, wheelsSetting.radius, 0.5, 8),
                new THREE.MeshNormalMaterial({ flatShading: true })
            )
            visual.geometry.rotateZ(Math.PI * 0.5)
            visual.rotation.reorder('YXZ')
            visual.position.copy(basePosition)
            this.chassis.visual.add(visual)
            this.wheels.items.push({ visual, basePosition })
        }
    }

    setJump()
    {
        this.jump = {}
        this.jump.force = 8
        this.jump.activate = () =>
        {
            if(this.wheels.inContact > 0)
            {
                const impulse = this.up.clone().multiplyScalar(this.jump.force * this.chassis.physical.body.mass())
                this.chassis.physical.body.applyImpulse(impulse)

                let torqueY = 0
                if(this.game.inputs.keys.left)
                    torqueY += 2
                else
                    torqueY -= 2
                this.chassis.physical.body.applyTorqueImpulse({ x: 0, y: torqueY, z: 0 })
            }
        }

        this.game.inputs.events.on('jump', (_down) =>
        {
            if(_down)
                this.jump.activate()
        })
    }

    setReset()
    {
        this.reset = {}
        this.reset.activate = () =>
        {
            this.chassis.physical.body.setTranslation({ x: 2, y: 4, z: 2 })
            this.chassis.physical.body.setRotation({ w: 1, x: 0, y: 0, z: 0 })
            this.chassis.physical.body.setLinvel({ x: 0, y: 0, z: 0 })
            this.chassis.physical.body.setAngvel({ x: 0, y: 0, z: 0 })
        }

        this.game.inputs.events.on('reset', (_down) =>
        {
            if(_down)
                this.reset.activate()
        })
    }

    updatePrePhysics()
    {
        this.wheels.engineForce = 0
        if(this.game.inputs.keys.up)
            this.wheels.engineForce += 6
        if(this.game.inputs.keys.down)
            this.wheels.engineForce -= 6

        if(this.game.inputs.keys.boost)
            this.wheels.engineForce *= 2.5

        this.wheels.steering = 0
        if(this.game.inputs.keys.right)
            this.wheels.steering -= 0.5
        if(this.game.inputs.keys.left)
            this.wheels.steering += 0.5
        this.controller.setWheelSteering(0, this.wheels.steering)
        this.controller.setWheelSteering(2, this.wheels.steering)

        let brake = 0.04
        if(this.game.inputs.keys.brake)
        {
            this.wheels.engineForce *= 0.5
            brake = 0.5
        }

        for(let i = 0; i < 4; i++)
        {
            this.controller.setWheelBrake(i, brake)
            this.controller.setWheelEngineForce(i, this.wheels.engineForce)
        }
    }

    updatePostPhysics()
    {
        this.wheels.visualSteering += (this.wheels.steering - this.wheels.visualSteering) * this.game.time.delta * 16

        this.wheels.inContact = 0

        for(let i = 0; i < 4; i++)
        {
            const wheel = this.wheels.items[i]

            wheel.visual.rotation.x += this.wheels.engineForce * 0.01
            wheel.visual.rotation.y = this.wheels.visualSteering

            wheel.visual.position.y = wheel.basePosition.y - this.controller.wheelSuspensionLength(i)

            if(this.controller.wheelIsInContact(i))
                this.wheels.inContact++
        }

        this.up.set(0, 1, 0).applyQuaternion(this.chassis.physical.body.rotation())
    }
}