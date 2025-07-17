import * as THREE from 'three/webgpu'

export class Pointer
{
    constructor(element)
    {
        this.element = element

        this.current = { x: 0, y: 0 }
        this.delta = { x: 0, y: 0 }
        this.upcoming = { x: 0, y: 0 }
        this.isDown = false
        this.upcomingDown = false
        this.hasMoved = false
        this.hasClicked = false
        this.hasReleased = false

        this.element.addEventListener('pointermove', (_event) =>
        {
            this.upcoming.x = _event.clientX
            this.upcoming.y = _event.clientY
        })

        this.element.addEventListener('pointerdown', (_event) =>
        {
            this.upcomingDown = true
        })

        addEventListener('pointerup', (_event) =>
        {
            this.upcomingDown = false
        })
    }

    update()
    {
        this.delta.x = this.upcoming.x - this.current.x
        this.delta.y = this.upcoming.y - this.current.y

        this.current.x = this.upcoming.x
        this.current.y = this.upcoming.y

        this.hasMoved = this.delta.x !== 0 || this.delta.y !== 0

        this.hasClicked = false
        this.hasReleased = false
        
        if(this.upcomingDown !== this.isDown)
        {
            this.isDown = this.upcomingDown

            if(this.isDown)
                this.hasClicked = true
            else
                this.hasReleased = true
        }
    }
}