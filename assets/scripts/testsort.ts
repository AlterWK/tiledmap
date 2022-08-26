import Role from './role';
import { CityConfig } from './testcpu';
import { TopoLogicalSort } from './toposort';
import { utility } from './utility';

const { ccclass, property } = cc._decorator;

@ccclass
export default class TestSort extends cc.Component {
    @property(cc.Node)
    panelMain: cc.Node = null;
    @property(cc.Node)
    panelUI: cc.Node = null;
    @property(cc.Node)
    panelPath: cc.Node = null;

    paths: cc.Vec3[][] = [];

    onLoad() {
        this.registerEvents();
    }

    start() {
        let topoSort = new TopoLogicalSort();
        // topoSort.sort(this.panelUI.children);

        for (let child of this.panelUI.children) {
            child.zIndex = Math.floor(child.x / 100) - Math.floor(child.y);
        }

        this.initPaths();
        this.drawRole();
    }

    initPaths() {
        for (let i = 0; i < this.panelPath.childrenCount; ++i) {
            let child = this.panelPath.children[i];
            let t: cc.Vec3[] = [];
            for (let j = 0; j < child.childrenCount; ++j) {
                t.push(child.children[j].position);
            }
            this.paths.push(t);
        }
    }

    registerEvents() {
        this.panelMain.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.panelMain.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoved, this);
        this.panelMain.on(cc.Node.EventType.TOUCH_END, this.onTouchEnded, this);
        this.panelMain.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        /*  cc.director.on(
            cc.Director.EVENT_BEFORE_DRAW,
            () => {
                topoSort.sort(this.panelUI.children);
            },
            this
        );

        cc.director.on(
            cc.Director.EVENT_AFTER_DRAW,
            () => {
                for (let i = 0; i < topoSort.sortList.length; ++i) {
                    topoSort.sortList[i].currentNode.zIndex = i;
                }
            },
            this
        ); */
    }

    onTouchStart(event: cc.Event.EventTouch) {}

    onTouchMoved(event: cc.Event.EventTouch) {
        let delta = event.getDelta();
        let pos = this.panelMain.position.add(cc.v3(delta.x, delta.y));
        let maxDiffX = (this.panelMain.width - cc.view.getVisibleSize().width) / 2;
        let maxDiffY = (this.panelMain.height - cc.view.getVisibleSize().height) / 2;
        this.panelMain.x = utility.clamp(pos.x, -maxDiffX, maxDiffX);
        this.panelMain.y = utility.clamp(pos.y, -maxDiffY, maxDiffY);
    }

    onTouchEnded(event: cc.Event.EventTouch) {}

    onTouchCancel(event: cc.Event.EventTouch) {}

    drawRole() {
        let numAtlas = utility.randomRangeInt(1, CityConfig.role.length);
        for (let i = 0; i < numAtlas; ++i) {
            utility.loadRes(CityConfig.role[i], cc.SpriteAtlas).then((atlas: cc.SpriteAtlas) => {
                let anims = utility.parseAnimationFromAtlas(atlas);
                for (let j = 0; j < 10; ++j) {
                    let animation = utility.createOneAnimation(anims, atlas);
                    let path = this.paths[utility.randomRangeInt(0, this.paths.length - 1)];
                    if (j == 9) {
                        path = this.paths[this.paths.length - 1];
                    }
                    animation.position = path[0] || cc.v3();
                    animation.addComponent(Role);
                    animation.setAnchorPoint(0.5, 0);
                    let tween = new cc.Tween();
                    for (let index = 1; index < path.length; ++index) {
                        let time = path[index].sub(path[index - 1]).len() / 150;
                        tween = tween.to(time, { x: path[index].x, y: path[index].y });
                    }
                    if (path.length === 4) {
                        let time = path[path.length - 1].sub(path[0]).len() / 150;
                        tween.to(time, { x: path[0].x, y: path[0].y });
                        tween.union().repeatForever();
                    } else {
                        console.log('special');
                        let t = tween.union().clone().reverseTime();
                        tween.then(t).union().repeatForever();
                    }
                    this.panelUI.addChild(animation);
                    tween.target(animation).start();
                }
            });
        }
    }
}
