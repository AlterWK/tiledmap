const { ccclass, property } = cc._decorator;

@ccclass
export default class TestView extends cc.Component {
    @property(cc.Node)
    panelUI: cc.Node = null;

    start() {
        for (let child of this.panelUI.children) {
            if (child.name == 'role') {
                child.setAnchorPoint(0.5, 0);
                child.zIndex = -Math.floor(child.y);
            } else if (child.name != 'player') {
                child.setAnchorPoint(1, 0);
                let nodeBarycenter = child.getChildByName('nodeBarycenter');
                let pos = nodeBarycenter.position.add(child.position);
                child.zIndex = -Math.floor(pos.y);
            }
        }
    }
}
