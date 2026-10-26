// One-way downgrade only: two consecutive five-second windows below 24 FPS,
// then a thirty-second cooldown. Manual selection disables this sampler.
export class QualitySampler {
  seconds = 0; frames = 0; poor = 0; cooldown = 0
  sample(delta: number, hidden: boolean) {
    if (hidden || delta > 1 || delta <= 0) { this.seconds = 0; this.frames = 0; this.poor = 0; return false }
    this.cooldown = Math.max(0, this.cooldown - delta)
    this.seconds += delta; this.frames++
    if (this.seconds < 5) return false
    this.poor = this.frames / this.seconds < 24 ? this.poor + 1 : 0
    this.seconds = 0; this.frames = 0
    if (this.poor < 2 || this.cooldown > 0) return false
    this.poor = 0; this.cooldown = 30
    return true
  }
}
