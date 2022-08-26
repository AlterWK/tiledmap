import { utility } from './utility';

const { ccclass, property } = cc._decorator;

@ccclass
export default class Role extends cc.Component {
    up: cc.Node = null;
    down: cc.Node = null;

    protected update(dt: number): void {
        this.node.zIndex = Math.floor(this.node.x / 100) - Math.floor(this.node.y);
        /* if (this.node.y < 0) {
            this.node.parent = this.up;
        } else {
            this.node.parent = this.down;
        } */
    }

    move() {
        let posX = utility.randomRange(-100, 100);
        let posY = utility.randomRange(-100, 100);
        let time = cc.v2(posX, posY).len() / 50;
        cc.tween(this.node)
            .by(time, { x: posX, y: posY })
            .call(() => {
                this.move();
            })
            .start();
    }
}
