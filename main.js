const unhidden = new Set();
const nowhidden = new Set();
let coin_move_count = 0;
const handlers = {
    lines_intersect: (p1, p2, p3, p4) => {
        // https://stackoverflow.com/a/16725715/1418014
        function Turn(p1, p2, p3) {
            a = p1.x; b = p1.y; 
            c = p2.x; d = p2.y;
            e = p3.x; f = p3.y;
            A = (f - b) * (c - a);
            B = (d - b) * (e - a);
            return (A > B + Number.EPSILON) ? 1 : (A + Number.EPSILON < B) ? -1 : 0;
        }
        return (Turn(p1, p3, p4) != Turn(p2, p3, p4)) && (Turn(p1, p2, p3) != Turn(p1, p2, p4));
    },
    get_transformed_bbox: el => {
        // note that this is not fully general. Iff you have one single translate() in transform, it works.
        let bb = el.getBBox();
        let t = ["ignore", "0", "0"];
        if (el.getAttribute("transform")) {
            t = el.getAttribute("transform").match(/translate\(([0-9.-]+)[ ,]([0-9.-]+)\)/);
        }
        bb.x += parseFloat(t[1]);
        bb.y += parseFloat(t[2]);
        return bb;
    },
    drawer_slide: el => {
        if (!el.dataset.open) {
            el.style.transform = "translateY(16%)";
            el.dataset.open = "yes";
        } else {
            el.style.transform = "";
            el.dataset.open = "";
        }
        document.getElementById("drawer").play();
    },
    start_music: el => {
        document.getElementById("bgm").play();
    },
    take: async el => {
        /* remember to remove the desc from the SVGs for individual items, or they're takeable
           when they're in inventory */
        taken.push({scene: currentRoom, obj: el.getAttribute("id")});
        el.remove();
        document.getElementById("collect").play();
        let li = document.createElement("li");
        let response = await fetch(el.id + ".svg");
        li.innerHTML = await response.text();
        li.dataset.using = "no";
        li.dataset.item = el.id;
        li.onclick = function() {
            if (li.dataset.using == "no") {
                let existing = document.querySelector('li[data-using="yes"]');
                if (existing) { existing.dataset.using = "no"; }
                let invsvg = li.querySelector("svg");
                let crs = invsvg.cloneNode(true);
                let bb = invsvg.getBoundingClientRect();
                crs.setAttribute("width", bb.width);
                crs.setAttribute("height", bb.width);
                [_, _, vbw, vbh] = crs.getAttribute('viewBox').split(" ");
                let pointer = document.createElementNS("http://www.w3.org/2000/svg", "path");
                pointer.setAttribute("d", "M0,0 L" + (vbw / 8) + ",0 L0," + (vbw / 8) + "Z");
                pointer.setAttribute("fill", "red")
                crs.appendChild(pointer);
                let dataurl = "data:image/svg+xml;base64," + btoa(crs.outerHTML);
                document.body.style.cursor = "url(" + dataurl + "), auto";
                li.dataset.using = "yes";
            } else {
                document.body.style.cursor = "auto";
                li.dataset.using = "no";
            }
        }
        document.querySelector("#inventory ul").appendChild(li);
        show_taken(el.getAttribute("id"));
    },
    use: (nail, hammer) => { // these are IDs, not elements
        console.log("using", hammer, "on", nail);
        if (nail == "candle" && hammer == "matches") {
            document.getElementById("flame").style.visibility = "visible";
            document.getElementById("glow").style.visibility = "visible";
            document.getElementById("secretmessage").style.visibility = "visible";
            unhidden.add("flame");
            unhidden.add("glow");
            unhidden.add("secretmessage");
            document.getElementById("ignite").play();
        } else if (nail == "tiles" && hammer == "knife") {
            document.getElementById("tileholes").style.visibility = "visible";
            unhidden.add("tileholes");
            document.getElementById("tiles").style.visibility = "hidden";
            nowhidden.add("tiles");
            document.getElementById("tileremove").play();
        } else {
            show_error("The " + hammer + " doesn't work on that");
        }
    }
}
let currentRoom;
const taken = [];
const buttons = new Set(["down", "up", "left", "right"]);
function show_error(msg) {
    let aside = document.querySelector("aside#error");
    aside.textContent = msg;
    aside.style.opacity = 1;
    setTimeout(() => { aside.style.opacity = 0; }, 1500);
}
function show_taken(msg) {
    let aside = document.querySelector("aside#taken");
    aside.textContent = msg;
    aside.style.opacity = 1;
    setTimeout(() => { aside.style.opacity = 0; }, 1500);
}
function hookup() {
    let buttons_found = new Set();
    let aside = document.querySelector("aside");
    Array.from(document.querySelectorAll("svg desc")).forEach(el => {
        let p = el.parentNode;
        let clickrect;
        el.textContent.split("\n").forEach(line => {
            let parts = line.trim().split(":");
            if (parts.length == 2) {
                if (parts[0] == "click" || parts[0] == "use" || parts[0] == "mousedown") {
                    let fn;
                    if (parts[0] == "use") {
                        fn = (e) => {
                            // note: you must define use handlers before click handlers in the description!
                            // otherwise the click handler will be defined before the use handler, and so
                            // the use handler's stopImmediatePropagation will be useless
                            let existing = document.querySelector('li[data-using="yes"]');
                            if (existing) {
                                if (parts[1] == existing.dataset.item) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.stopImmediatePropagation();
                                    handlers.use(p.id, parts[1]);
                                } else {
                                    show_error("The " + existing.dataset.item + " doesn't work on that");
                                }
                            }
                        }
                    } else if (handlers[parts[1]]) {
                        fn = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlers[parts[1]](p, e);
                        }
                    } else {
                        fn = () => {
                            load(parts[1]);
                        }
                    }
                    let vbbg = p.getBBox();
                    let rect;
                    if (clickrect) {
                        rect = clickrect;
                    } else {
                        rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                        rect.setAttribute("x", vbbg.x)
                        rect.setAttribute("y", vbbg.y)
                        rect.setAttribute("width", vbbg.width)
                        rect.setAttribute("height", vbbg.height)
                        rect.setAttribute("fill", "transparent")
                        rect.setAttribute("data-clickrect", "clickrect");
                        rect.dataset.clickable = "clickable";
                        if (p.nodeName != "g") {
                            // putting the clickrect inside another element is likely to
                            // not work because the other element will eat all our clicks
                            // so put it in the parent of the parentNode, and make sure it's
                            // at the end, so definitely after the actual element and therefore
                            // on top of it
                            p.parentNode.appendChild(rect);
                        } else {
                            p.insertBefore(rect, p.firstChild);
                        }
                        clickrect = rect;
                    }
                    if (parts[0] == "mousedown") {
                        rect.addEventListener("mousedown", fn, false);
                    } else {
                        rect.addEventListener("click", fn, false);
                    }
                } else if (buttons.has(parts[0])) {
                    buttons_found.add(parts[0]);
                    document.getElementById(parts[0]).dataset.goto = parts[1];
                } else if (parts[0] == "init") {
                    handlers[parts[1]](p);
                }
            } else if (parts.length == 1) {
                if (parts[0] == "takeable") {
                    fn = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlers.take(p);
                    }
                    let vbbg = p.getBBox();
                    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    rect.setAttribute("x", vbbg.x)
                    rect.setAttribute("y", vbbg.y)
                    rect.setAttribute("width", vbbg.width)
                    rect.setAttribute("height", vbbg.height)
                    rect.setAttribute("fill", "transparent")
                    p.insertBefore(rect, p.firstChild);
                    rect.onclick = fn;
                    rect.dataset.clickable = "clickable";
                } else if (parts[0] == "hidden" && !unhidden.has(p.id)) {
                    // note: if an element is hidden and has click or use handlers,
                    // you must define hidden AFTER other stuff, otherwise we hide it
                    // first and then can't create the bbox for it to make a clickrect
                    p.style.visibility = "hidden";
                }
            }
        })
    })
    buttons.forEach(bname => {
        if (buttons_found.has(bname)) {
            document.getElementById(bname).style.display = "block";
        } else {
            document.getElementById(bname).style.display = "none";
        }
    })
    // and make all not-explicitly-clickable leaf elements unclickable
    Array.from(document.querySelectorAll("svg *")).forEach(el => {
        if (!el.dataset.clickable && el.childNodes.length === 0) {
            el.style.pointerEvents = "none";
        }
    })
    // and remove all already-taken items that aren't in inventory
    taken.filter(item => item.scene == currentRoom).map(
        item => { 
            let obj = document.getElementById(item.obj);
            if (!obj.closest("#inventory")) {
                obj.remove();
            }
        })
    // and remove all now hidden items
    Array.from(nowhidden).map(
        item => { 
            let obj = document.getElementById(item);
            if (obj) obj.remove();
        })
    // and show main (it was made invisible so that we don't see hidden stuff briefly appear)
    document.querySelector("main").style.opacity = "1";
}
function resize() {
    // size the svg
    let svg = document.querySelector("main > svg");
    let war = window.innerWidth / window.innerHeight;
    let sar = 800 / 600;
    let t, l, w, h;
    if (war > sar) {
        h = window.innerHeight;
        w = h * sar;
        t = 0;
        l = (window.innerWidth - w) / 2;
    } else {
        w = window.innerWidth;
        h = w / sar;
        l = 0;
        t = (window.innerHeight - h) / 2;
    }
    svg.style.height = h + "px";
    svg.style.width = w + "px";
    svg.style.top = t + "px";
    svg.style.left = l + "px";
    // move inventory
    let inv = document.querySelector("#inventory");
    let iw = w / 8;
    inv.style.width = iw + "px";
    inv.style.left = (l + w - iw) + "px";
    inv.style.top = t + "px";
    inv.style.height = h + "px";
    // and move the buttons
    let up = document.querySelector("#up");
    let right = document.querySelector("#right");
    let down = document.querySelector("#down");
    let left = document.querySelector("#left");
    let bh = h / 20; let bw = w / 20;
    up.style.top = t + "px"; up.style.left = l + "px";
    up.style.width = (w - iw) + "px"; up.style.height = bh + "px";
    left.style.top = t + "px"; left.style.left = l + "px";
    left.style.width = bw + "px"; left.style.height = h + "px";
    down.style.top = (t + h - bh) + "px"; down.style.left = l + "px";
    down.style.width = (w - iw) + "px"; down.style.height = bh + "px";
    right.style.top = t + "px"; right.style.left = (l + w - bw - iw) + "px";
    right.style.width = bw + "px"; right.style.height = h + "px";
    // and the error
    let error = document.querySelector("aside#error");
    error.style.top = (t + bh + 20) + "px";
    error.style.left = (l + bw + 20) + "px";
    // and the taken
    let taken = document.querySelector("aside#taken");
    taken.style.top = (t + bh + 20) + "px";
    taken.style.right = (((window.innerWidth - w) / 2) + iw + 20) + "px";
}
async function load(r) {
    Array.from(document.querySelectorAll("aside div")).forEach(d => { d.remove() });
    let response = await fetch(r + ".svg");
    let response_js;
    if (!document.querySelector('script[data-room="' + r + '"]')){
        response_js = await fetch(r + ".js");
    }
    document.querySelector("main").style.opacity = "0";
    setTimeout(async () => {
        document.querySelector("main").innerHTML = await response.text();
        currentRoom = r;
        resize();
        if (response_js && response_js.status != 404) {
            let scr = document.createElement("script");
            scr.dataset.room = r;
            scr.textContent = await response_js.text();
            document.body.appendChild(scr);
        }
        setTimeout(hookup, 0);
    }, 100);
}
buttons.forEach(bname => {
    let b = document.getElementById(bname);
    b.onclick = () => {
        load(b.dataset.goto); 
    }
});
load("title");
window.onresize = resize;
