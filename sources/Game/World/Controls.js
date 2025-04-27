import { Game } from '../Game.js'
import { InteractiveAreas } from '../InteractiveAreas.js'

export class Controls
{
    constructor(interactiveAreaPosition)
    {
        this.game = Game.getInstance()
        
        this.interactiveAreaPosition = interactiveAreaPosition

        this.setInteractiveArea()
    }

    setInteractiveArea()
    {
        this.game.interactiveAreas.create(
            this.interactiveAreaPosition,
            'Controls',
            InteractiveAreas.ALIGN_RIGHT,
            () =>
            {
                this.game.modals.open('controls')
            }
        )
    }
}