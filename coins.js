handlers.coin_click = el => {
    // if we don't have slots set up for coins, set them up
    if (!document.querySelector("[data-coin-slot]")) {
        document.getElementById("coin1").dataset.coinSlot = "4_3";
        document.getElementById("coin2").dataset.coinSlot = "3_3";
        document.getElementById("coin3").dataset.coinSlot = "3_4";
        document.getElementById("coin4").dataset.coinSlot = "2_2";
        document.getElementById("coin5").dataset.coinSlot = "2_3";
        document.getElementById("coin6").dataset.coinSlot = "2_4";
        coin_move_count = 0;
    }
    let existing = document.querySelector(".chosen-coin");
    if (existing) existing.classList.remove("chosen-coin");
    let existing_slots = document.querySelectorAll(".available-slot");
    if (existing_slots.length > 0) Array.from(existing_slots).map(es => {
        es.classList.remove("available-slot");
    });
    if (existing == el) { return; }
    el.classList.add("chosen-coin");
    // and calculate available slots
    let coins_in = Array.from(document.querySelectorAll("[data-coin-slot]")).map(cel => {
        return cel.dataset.coinSlot.split("_").map(v => parseInt(v, 10));
    })
    let two_coin_slots = {};
    let add = (x, y) => {
        if (!two_coin_slots[[y,x]]) two_coin_slots[[y,x]] = 0;
        two_coin_slots[[y,x]] += 1;
    }
    coins_in.forEach(([y, x]) => {
        if (el.dataset.coinSlot == y + "_" + x) return; // can't count us as part of the 2 coins!
        add(x-1, y); add(x+1, y);
        if (y%2 == 1) {
            // odd row
            add(x-1, y-1); add(x, y-1); add(x-1, y+1); add(x, y+1);
        } else {
            // even row
            add(x, y-1); add(x+1, y-1); add(x, y+1); add(x+1, y+1);
        }
    })
    // if we are a coin in the middle of a hexagon and there are only 1-coin-wide gaps
    // in the hexagon, then we can't move anywhere
    let our_hexagon = {1: "off", 2: "off", 3: "off", 4: "off", 5: "off", 6: "off"};
    let [our_y, our_x] = el.dataset.coinSlot.split("_").map(x => { return parseInt(x, 10); })
    let coins_in_text = coins_in.map(([y, x]) => y + "-" + x);
    let isCoin = (y, x) => {
        return coins_in_text.includes(y + "-" + x) ? "coin": "empty";
    }
    if (our_x > 1) { our_hexagon[3] = isCoin(our_y, our_x-1); }
    if ((our_x < 5 && our_y % 2 == 0) || (our_x < 6 && our_y % 2 == 1)) {
        our_hexagon[4] = isCoin(our_y, our_x+1);
    }
    if (our_y > 1 && (our_y % 2 == 0)) {
        our_hexagon[1] = isCoin(our_y-1, our_x);
        our_hexagon[2] = isCoin(our_y-1, our_x+1);
    }
    if (our_y > 1 && (our_y % 2 == 1)) {
        our_hexagon[1] = isCoin(our_y-1, our_x-1);
        our_hexagon[2] = isCoin(our_y-1, our_x);
    }
    if (our_y < 5 && (our_y % 2 == 0)) {
        our_hexagon[5] = isCoin(our_y+1, our_x);
        our_hexagon[6] = isCoin(our_y+1, our_x+1);
    }
    if (our_y < 5 && (our_y % 2 == 1)) {
        our_hexagon[5] = isCoin(our_y+1, our_x-1);
        our_hexagon[6] = isCoin(our_y+1, our_x);
    }
    if ((our_hexagon[1] == "empty" && our_hexagon[2] == "empty") ||
        (our_hexagon[1] == "empty" && our_hexagon[3] == "empty") ||
        (our_hexagon[2] == "empty" && our_hexagon[4] == "empty") ||
        (our_hexagon[3] == "empty" && our_hexagon[5] == "empty") ||
        (our_hexagon[4] == "empty" && our_hexagon[5] == "empty") ||
        (our_hexagon[5] == "empty" && our_hexagon[6] == "empty")) {
        // there is a two-coin gap, so we're OK; continue as planned
    } else {
        // no two-coin gap, so wipe two_coin_slots because this coin is not moveable
        two_coin_slots = {};
    }

    for (let k in two_coin_slots) {
        if (two_coin_slots[k] >= 2) {
            let slot = document.getElementById("coin_slot_" + k.replace(",", "_"));
            if (slot) {
                slot.classList.add("available-slot");
            }
        }
    }
}

handlers.coin_slot_click = el => {
    if (coin_move_count == 4) return;
    if (!el.classList.contains("available-slot")) return;
    let cc = document.querySelector(".chosen-coin");
    if (!cc) return;
    let fromSlot = document.getElementById("coin_slot_" + cc.dataset.coinSlot);
    let fromBB = fromSlot.getBBox();
    let toBB = el.getBBox();
    let xdiff = toBB.x - fromBB.x;
    let ydiff = toBB.y - fromBB.y;
    let trans = cc.getAttribute("transform");
    let parts = trans.replace("matrix(", "").replace(")", "").split(",");
    parts[4] = (parseFloat(parts[4]) + xdiff).toString();
    parts[5] = (parseFloat(parts[5]) + ydiff).toString();
    cc.setAttribute("transform", "matrix(" + parts.join(",") + ")");
    cc.classList.remove("chosen-coin");
    cc.dataset.coinSlot = el.id.replace("coin_slot_", "");
    let existing_slots = document.querySelectorAll(".available-slot");
    if (existing_slots.length > 0) Array.from(existing_slots).map(es => {
        es.classList.remove("available-slot");
    });
    coin_move_count += 1;
    document.getElementById("coin_move_" + coin_move_count).style.display = "none";
    if (coin_move_count == 4) {
        let coins_in = Array.from(document.querySelectorAll("[data-coin-slot]")).map(cel => {
            return cel.dataset.coinSlot.split("_").map(v => parseInt(v, 10));
        })
        let my = Math.min.apply(null, coins_in.map(a => a[0]));
        let mx = Math.min.apply(null, coins_in.map(a => a[1]));
        coins_in = coins_in.map(([y, x]) => [y-my, x-mx]);
        coins_in.sort((a, b) => {
            if (a[0] == b[0]) return a[1] - b[1];
            return a[0] - b[0];
        });
        let result = coins_in.map(([y, x]) => y + "" + x).join("");
        if (result == "010210122122" || result == "000110122021") {
            console.log("ok!");
            return;
        } else {
            console.log(result);
        }

        document.getElementById("coinfail").play();
        setTimeout(() => {
            coin_move_count = 0;
            load("coins");
        }, 1000);
    }
}
