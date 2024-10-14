import { Game } from './Game.js'

export class Physics
{
    constructor()
    {
        this.game = new Game()

        this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 })

        this.setExample()
        this.game.time.events.on('tick', () =>
        {
            this.update()
        })
    }

    setExample()
    {
        // Create the ground
        const groundCollider = RAPIER.ColliderDesc.cuboid(10.0, 1, 10.0).setTranslation(0.0, - 1.01, 0.0)
        this.world.createCollider(groundCollider)
    }

    update()
    {
        this.world.timestep = this.game.time.delta * 2
        this.world.step()

        this.world.vehicleControllers.forEach((_vehicleController) =>
        {
            _vehicleController.updateVehicle(this.world.timestep)
        })
    }
}