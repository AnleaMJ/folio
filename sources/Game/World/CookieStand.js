import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { Fn, normalWorld, texture, vec4 } from 'three/tsl'

export class CookieStand
{
    constructor(cookieBanner)
    {
        this.game = Game.getInstance()

        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '🍪 Cookie Stand',
                expanded: true,
            })
        }

        this.cookieBanner = cookieBanner

        this.setBanner()
    }

    setBanner()
    {
        const material = new THREE.MeshBasicNodeMaterial()

        // Shadow receive
        const totalShadows = this.game.lighting.addTotalShadowToMaterial(material)

        material.outputNode = Fn(() =>
        {
            const baseColor = texture(this.game.resources.cookieBannerTexture)

            // return baseColor
            return this.game.lighting.lightOutputNodeBuilder(baseColor, normalWorld, totalShadows, true, false)
        })()

        this.cookieBanner.material = material
    }
}