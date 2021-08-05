export class ProgressBar {

    constructor(dimension, color, percentage) {
      ({x: this.x, y: this.y, width: this.w, height: this.h} = dimension);
      this.color = color;
      this.percentage = percentage / 100;
      this.p;
    }
    
    
    draw(ctx, percentage) {
      this.percentage = percentage;
      // Visualize -------
      this.visualize(ctx);
      // -----------------
      this.p = this.percentage * this.w;
      if(this.p <= this.h) {
        ctx.beginPath();
        ctx.arc(this.h / 2 + this.x, this.h / 2 + this.y, this.h / 2, Math.PI - Math.acos((this.h - this.p) / this.h), Math.PI + Math.acos((this.h - this.p) / this.h));
        ctx.save();
        ctx.scale(-1, 1);
        ctx.arc((this.h / 2) - this.p - this.x, this.h / 2 + this.y, this.h / 2, Math.PI - Math.acos((this.h - this.p) / this.h), Math.PI + Math.acos((this.h - this.p) / this.h));
        ctx.restore();
        ctx.closePath();
      } else {
        ctx.beginPath();
        ctx.arc(this.h / 2 + this.x, this.h / 2 + this.y, this.h / 2, Math.PI / 2, 3 / 2 *Math.PI);
        ctx.lineTo(this.p - this.h + this.x, 0 + this.y);
        ctx.arc(this.p - (this.h / 2) + this.x, this.h / 2 + this.y, this.h / 2, 3 / 2 * Math.PI, Math.PI / 2);
        ctx.lineTo(this.h / 2 + this.x, this.h + this.y);
        ctx.closePath();
      }
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    
    visualize(ctx){
        this.showWholeProgressBar(ctx);
    }
  
    showWholeProgressBar(ctx){
      ctx.beginPath();
      ctx.arc(this.h / 2 + this.x, this.h / 2 + this.y, this.h / 2, Math.PI / 2, 3 / 2 * Math.PI);
      ctx.lineTo(this.w - this.h + this.x, 0 + this.y);
      ctx.arc(this.w - this.h / 2 + this.x, this.h / 2 + this.y, this.h / 2, 3 / 2 *Math.PI, Math.PI / 2);
      ctx.lineTo(this.h / 2 + this.x, this.h + this.y);
      ctx.strokeStyle = '#347fc4';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();
    }
    
    get PPercentage(){
      return this.percentage * 100;
    }
    
    set PPercentage(x){
      this.percentage = x / 100;
    }
    
  }