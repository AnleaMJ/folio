import { Events } from '../Events.js'

export default class Keyboard
{
    constructor()
    {
        this.events = new Events()

        this.pressed = []

        // Trigger up when tab visibility changes to visible
        document.addEventListener('visibilitychange', () =>
        {
            if(!document.hidden)
            {
                for(const key of this.pressed)
                    this.events.trigger('up', [ key ])

                this.pressed = []
            }
        })

        addEventListener('keydown', (_event) =>
        {
            this.pressed.push(_event.code)
            this.events.trigger('down', [ _event.code ])
        })

        addEventListener('keyup', (_event) =>
        {
            const index = this.pressed.indexOf(_event.code)

            if(index !== -1)
                this.pressed.splice(index, 1)

            this.events.trigger('up', [ _event.code ])
        })
    }
}