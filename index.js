import { EventPriority, PowerNukkitX as pnx } from ":powernukkitx";
import { JavaClassBuilder } from ":jvm";
import { EntityIntelligent } from "cn.nukkit.entity.EntityIntelligent";
import { Entity } from "cn.nukkit.entity.Entity";
import { Server } from "cn.nukkit.Server";
import { BehaviorGroup } from "cn.nukkit.entity.ai.behaviorgroup.BehaviorGroup";
import { WalkController } from "cn.nukkit.entity.ai.controller.WalkController";
import { LookController } from "cn.nukkit.entity.ai.controller.LookController";
import { SimpleFlatAStarRouteFinder } from "cn.nukkit.entity.ai.route.SimpleFlatAStarRouteFinder";
import { WalkingPosEvaluator } from "cn.nukkit.entity.ai.route.posevaluator.WalkingPosEvaluator";
import { IBehaviorGroup } from "cn.nukkit.entity.ai.behaviorgroup.IBehaviorGroup";
import { Collections } from "java.util.Collections";
import { Set as JSet } from "java.util.Set"

/**
 * @class
 */
const MySheep = new JavaClassBuilder("MySheep", EntityIntelligent)
    .setJSDelegate({
        /** @type {Map<MySheep, cn.nukkit.entity.ai.behaviorgroup.BehaviorGroup>} */
        behaviorGroups: new Map(),
        new(chunk, nbt) {
            console.log(chunk);
            console.log(nbt);
            return [chunk, nbt];
        },
        /**
         * @arg javaThis {cn.nukkit.entity.EntityIntelligent}
         */
        constructor(javaThis) {
            javaThis.setEnablePitch(true);
            javaThis.setNameTagAlwaysVisible(true);
            javaThis.setNameTagVisible(true);
            javaThis.setNameTag("PNX JS Sheep");
            javaThis.spawnToAll();
        },
        getNetworkId() {
            return 13;
        },
        getWidth() {
            return 0.9;
        },
        getHeight() {
            return 1.3;
        },
        /**
         * @arg javaThis {cn.nukkit.entity.EntityIntelligent}
         */
        onUpdate(javaThis, currentTick) {
            const ret = javaThis.__super__onUpdate(currentTick);
            if ((currentTick & 7) === 0) { // currentTick % 8 === 0
                let nearestPlayer = null;
                let nearestDis = 99999999999;
                for (const i of javaThis.getLevel().getPlayers().values()) {
                    /** @type {cn.nukkit.Player} */
                    const player = i;
                    const tmpDis = player.distanceSquared(javaThis);
                    if (tmpDis < nearestDis) {
                        nearestPlayer = player;
                        nearestDis = tmpDis;
                    }
                }
                if (nearestPlayer != null) {
                    javaThis.lookTarget = nearestPlayer; // Look towards the player.
                    javaThis.moveTarget = nearestPlayer; // Walk to the player.
                }
            }
            return ret;
        },
        getBehaviorGroup(javaThis) {
            const tmp = this.behaviorGroups.get(javaThis);
            if (tmp) {
                return tmp;
            } else {
                this.behaviorGroups.set(javaThis, new BehaviorGroup(javaThis.tickSpread, Collections.emptySet(), Collections.emptySet(), Collections.emptySet(), JSet.of(
                    new WalkController(), new LookController(true, true)
                ), new SimpleFlatAStarRouteFinder(new WalkingPosEvaluator(), javaThis)));
                return this.behaviorGroups.get(javaThis);
            }
        },
        close(javaThis) {
            this.behaviorGroups.delete(javaThis);
            javaThis.__super__close();
        }
    }).addJavaConstructor("new", "constructor", ["cn.nukkit.level.format.FullChunk", "cn.nukkit.nbt.tag.CompoundTag"], "cn.nukkit.level.format.FullChunk", "cn.nukkit.nbt.tag.CompoundTag")
    .addJavaMethod("getNetworkId", "getNetworkId", "int")
    .addJavaMethod("getWidth", "getWidth", "float")
    .addJavaMethod("getHeight", "getHeight", "float")
    .addJavaSuperMethod("onUpdate", "boolean", "int")
    .addJavaMethod("onUpdate", "onUpdate", "boolean", "int")
    .addJavaMethod("getBehaviorGroup", "getBehaviorGroup", IBehaviorGroup)
    .addJavaSuperMethod("close", "void")
    .addJavaMethod("close", "close", "void")
    .compileToJavaClass();

export function main() {
    pnx.listenEvent("cn.nukkit.event.player.PlayerInteractEvent", EventPriority.NORMAL, e => {
        if (e.getItem().getNamespaceId() === "minecraft:stick") {
            const level = e.getPlayer().getLevel();
            level.addEntity(new MySheep(level.getChunk(e.getPlayer().getChunkX(), e.getPlayer().getChunkZ()), Entity.getDefaultNBT(e.getPlayer())));
        }
    })
}

export function close() {
    for (const i of Server.getInstance().getLevels().values()) { // Clear all the JS entities.
        /** @type {cn.nukkit.level.Level} */
        const level = i;
        level.getEntities().forEach(e => {
            if (e instanceof MySheep) {
                e.close();
            }
        })
    }
}
