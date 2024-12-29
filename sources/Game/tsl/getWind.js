import { time, vec2, Fn, texture } from 'three/tsl'

export default Fn(([noisesTexture, position]) =>
{
    const direction = vec2(
        -1,
        1
    ).normalize()

    const remapedPosition = position.mul(0.5)

    const noiseUv1 = remapedPosition.xy.mul(0.2).add(direction.mul(time.mul(0.1))).xy
    const noise1 = texture(noisesTexture, noiseUv1).r.sub(0.5)

    const noiseUv2 = remapedPosition.xy.mul(0.1).add(direction.mul(time.mul(0.02))).xy
    const noise2 = texture(noisesTexture, noiseUv2).r.sub(0.5)

    const intensity = noise2.add(noise1).mul(0.5)
    
    return vec2(direction.mul(intensity))
})