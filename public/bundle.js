
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/List.svelte generated by Svelte v3.23.2 */
    const file = "src/List.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (264:22) 
    function create_if_block_9(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let div_class_value;
    	let current;
    	const if_block_creators = [create_if_block_10, create_else_block_3];
    	const if_blocks = [];

    	function select_block_type_3(ctx, dirty) {
    		if (/*dropDown*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_3(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "listHor" : "list") + " svelte-2ykskc"));
    			add_location(div, file, 264, 0, 6470);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_3(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			if (!current || dirty & /*horizontal*/ 8 && div_class_value !== (div_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "listHor" : "list") + " svelte-2ykskc"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(264:22) ",
    		ctx
    	});

    	return block;
    }

    // (221:0) {#if darkMode && !buttonList}
    function create_if_block_2(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let div_class_value;
    	let current;
    	const if_block_creators = [create_if_block_3, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*dropDown*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", div_class_value = "" + ((/*horizontal*/ ctx[3] ? "listHor" : "list") + " dark" + " svelte-2ykskc"));
    			add_location(div, file, 221, 0, 4939);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			if (!current || dirty & /*horizontal*/ 8 && div_class_value !== (div_class_value = "" + ((/*horizontal*/ ctx[3] ? "listHor" : "list") + " dark" + " svelte-2ykskc"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(221:0) {#if darkMode && !buttonList}",
    		ctx
    	});

    	return block;
    }

    // (292:4) {:else}
    function create_else_block_3(ctx) {
    	let div;
    	let h3;
    	let t0;
    	let t1;
    	let each_1_anchor;
    	let each_value_4 = /*items*/ ctx[0];
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h3, file, 293, 8, 7666);
    			attr_dev(div, "class", "listHead svelte-2ykskc");
    			add_location(div, file, 292, 4, 7635);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);

    			if (dirty & /*horizontal, selectItem, items, showIcons*/ 553) {
    				each_value_4 = /*items*/ ctx[0];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(292:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (267:4) {#if dropDown}
    function create_if_block_10(ctx) {
    	let div;
    	let h3;
    	let t0;
    	let t1;
    	let button;
    	let t2;
    	let button_class_value;
    	let t3;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*dropDownState*/ ctx[7] === "open" && create_if_block_11(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			button = element("button");
    			t2 = text(/*dropDownText*/ ctx[8]);
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h3, file, 268, 12, 6585);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "dropBtnHor" : "dropBtn") + " svelte-2ykskc"));
    			add_location(button, file, 269, 12, 6614);
    			attr_dev(div, "class", "listHead svelte-2ykskc");
    			add_location(div, file, 267, 8, 6550);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(button, t2);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*changeDropDownState*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);
    			if (!current || dirty & /*dropDownText*/ 256) set_data_dev(t2, /*dropDownText*/ ctx[8]);

    			if (!current || dirty & /*horizontal*/ 8 && button_class_value !== (button_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "dropBtnHor" : "dropBtn") + " svelte-2ykskc"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (/*dropDownState*/ ctx[7] === "open") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*dropDownState*/ 128) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_11(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(267:4) {#if dropDown}",
    		ctx
    	});

    	return block;
    }

    // (299:12) {#if showIcons}
    function create_if_block_15(ctx) {
    	let span;
    	let t_value = /*item*/ ctx[12].icon + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "id", "icon");
    			add_location(span, file, 299, 16, 7857);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t_value !== (t_value = /*item*/ ctx[12].icon + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_15.name,
    		type: "if",
    		source: "(299:12) {#if showIcons}",
    		ctx
    	});

    	return block;
    }

    // (297:4) {#each items as item}
    function create_each_block_4(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[12].name + "";
    	let t1;
    	let t2;
    	let div_class_value;
    	let mounted;
    	let dispose;
    	let if_block = /*showIcons*/ ctx[5] && create_if_block_15(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "id", "itemText");
    			add_location(span, file, 301, 12, 7924);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "listItemHor" : "listItem") + " svelte-2ykskc"));
    			add_location(div, file, 297, 8, 7737);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*selectItem*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*showIcons*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_15(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*items*/ 1 && t1_value !== (t1_value = /*item*/ ctx[12].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*horizontal*/ 8 && div_class_value !== (div_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "listItemHor" : "listItem") + " svelte-2ykskc"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(297:4) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    // (273:8) {#if dropDownState === "open"}
    function create_if_block_11(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_3 = /*items*/ ctx[0];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*horizontal, selectItem, items, showIcons*/ 553) {
    				each_value_3 = /*items*/ ctx[0];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_3.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(273:8) {#if dropDownState === \\\"open\\\"}",
    		ctx
    	});

    	return block;
    }

    // (282:16) {:else}
    function create_else_block_2(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[12].name + "";
    	let t1;
    	let t2;
    	let div_class_value;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showIcons*/ ctx[5] && create_if_block_14(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "id", "itemText");
    			add_location(span, file, 286, 20, 7499);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "listItemHor" : "listItem") + " svelte-2ykskc"));
    			add_location(div, file, 282, 16, 7259);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*selectItem*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*showIcons*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_14(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*items*/ 1) && t1_value !== (t1_value = /*item*/ ctx[12].name + "")) set_data_dev(t1, t1_value);

    			if (!current || dirty & /*horizontal*/ 8 && div_class_value !== (div_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "listItemHor" : "listItem") + " svelte-2ykskc"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(282:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (275:16) {#if horizontal}
    function create_if_block_12(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[12].name + "";
    	let t1;
    	let t2;
    	let div_class_value;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showIcons*/ ctx[5] && create_if_block_13(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "id", "itemText");
    			add_location(span, file, 279, 24, 7151);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "listItemHor" : "listItem") + " svelte-2ykskc"));
    			add_location(div, file, 275, 20, 6875);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*selectItem*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*showIcons*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_13(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*items*/ 1) && t1_value !== (t1_value = /*item*/ ctx[12].name + "")) set_data_dev(t1, t1_value);

    			if (!current || dirty & /*horizontal*/ 8 && div_class_value !== (div_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "listItemHor" : "listItem") + " svelte-2ykskc"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: -400, duration: 600 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: -400, duration: 600 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(275:16) {#if horizontal}",
    		ctx
    	});

    	return block;
    }

    // (284:20) {#if showIcons}
    function create_if_block_14(ctx) {
    	let span;
    	let t_value = /*item*/ ctx[12].icon + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "id", "icon");
    			add_location(span, file, 284, 28, 7416);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t_value !== (t_value = /*item*/ ctx[12].icon + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_14.name,
    		type: "if",
    		source: "(284:20) {#if showIcons}",
    		ctx
    	});

    	return block;
    }

    // (277:24) {#if showIcons}
    function create_if_block_13(ctx) {
    	let span;
    	let t_value = /*item*/ ctx[12].icon + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "id", "icon");
    			add_location(span, file, 277, 28, 7060);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t_value !== (t_value = /*item*/ ctx[12].icon + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(277:24) {#if showIcons}",
    		ctx
    	});

    	return block;
    }

    // (274:12) {#each items as item}
    function create_each_block_3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_12, create_else_block_2];
    	const if_blocks = [];

    	function select_block_type_4(ctx, dirty) {
    		if (/*horizontal*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_4(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_4(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(274:12) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    // (249:4) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let h3;
    	let t0;
    	let t1;
    	let each_1_anchor;
    	let each_value_2 = /*items*/ ctx[0];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h3, file, 250, 8, 6104);
    			attr_dev(div, "class", "listHead svelte-2ykskc");
    			add_location(div, file, 249, 4, 6073);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);

    			if (dirty & /*horizontal, selectItem, items, showIcons*/ 553) {
    				each_value_2 = /*items*/ ctx[0];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(249:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (224:4) {#if dropDown}
    function create_if_block_3(ctx) {
    	let div;
    	let h3;
    	let t0;
    	let t1;
    	let button;
    	let t2;
    	let button_class_value;
    	let t3;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*dropDownState*/ ctx[7] === "open" && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			button = element("button");
    			t2 = text(/*dropDownText*/ ctx[8]);
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h3, file, 225, 12, 5063);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "dropBtnHorDark" : "dropBtnDark") + " svelte-2ykskc"));
    			add_location(button, file, 226, 12, 5092);
    			attr_dev(div, "class", "listHeadDark svelte-2ykskc");
    			add_location(div, file, 224, 8, 5024);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(button, t2);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*changeDropDownState*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);
    			if (!current || dirty & /*dropDownText*/ 256) set_data_dev(t2, /*dropDownText*/ ctx[8]);

    			if (!current || dirty & /*horizontal*/ 8 && button_class_value !== (button_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "dropBtnHorDark" : "dropBtnDark") + " svelte-2ykskc"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (/*dropDownState*/ ctx[7] === "open") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*dropDownState*/ 128) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(224:4) {#if dropDown}",
    		ctx
    	});

    	return block;
    }

    // (256:12) {#if showIcons}
    function create_if_block_8(ctx) {
    	let span;
    	let t_value = /*item*/ ctx[12].icon + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "id", "icon");
    			add_location(span, file, 256, 16, 6295);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t_value !== (t_value = /*item*/ ctx[12].icon + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(256:12) {#if showIcons}",
    		ctx
    	});

    	return block;
    }

    // (254:4) {#each items as item}
    function create_each_block_2(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[12].name + "";
    	let t1;
    	let t2;
    	let div_class_value;
    	let mounted;
    	let dispose;
    	let if_block = /*showIcons*/ ctx[5] && create_if_block_8(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "id", "itemText");
    			add_location(span, file, 258, 12, 6362);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "listItemHor" : "listItem") + " svelte-2ykskc"));
    			add_location(div, file, 254, 8, 6175);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*selectItem*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*showIcons*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_8(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*items*/ 1 && t1_value !== (t1_value = /*item*/ ctx[12].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*horizontal*/ 8 && div_class_value !== (div_class_value = "" + (null_to_empty(/*horizontal*/ ctx[3] ? "listItemHor" : "listItem") + " svelte-2ykskc"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(254:4) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    // (230:8) {#if dropDownState === "open"}
    function create_if_block_4(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*items*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectItem, items, showIcons, horizontal*/ 553) {
    				each_value_1 = /*items*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(230:8) {#if dropDownState === \\\"open\\\"}",
    		ctx
    	});

    	return block;
    }

    // (239:16) {:else}
    function create_else_block(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[12].name + "";
    	let t1;
    	let t2;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showIcons*/ ctx[5] && create_if_block_7(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "id", "itemText");
    			add_location(span, file, 243, 20, 5937);
    			attr_dev(div, "class", "listItemDark svelte-2ykskc");
    			add_location(div, file, 239, 16, 5724);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*selectItem*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*showIcons*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_7(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*items*/ 1) && t1_value !== (t1_value = /*item*/ ctx[12].name + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(239:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (232:16) {#if horizontal}
    function create_if_block_5(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[12].name + "";
    	let t1;
    	let t2;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showIcons*/ ctx[5] && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "id", "itemText");
    			add_location(span, file, 236, 24, 5616);
    			attr_dev(div, "class", "listItemHorDark svelte-2ykskc");
    			add_location(div, file, 232, 20, 5363);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*selectItem*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*showIcons*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_6(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*items*/ 1) && t1_value !== (t1_value = /*item*/ ctx[12].name + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: -400, duration: 600 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: -400, duration: 600 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(232:16) {#if horizontal}",
    		ctx
    	});

    	return block;
    }

    // (241:20) {#if showIcons}
    function create_if_block_7(ctx) {
    	let span;
    	let t_value = /*item*/ ctx[12].icon + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "id", "icon");
    			add_location(span, file, 241, 28, 5854);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t_value !== (t_value = /*item*/ ctx[12].icon + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(241:20) {#if showIcons}",
    		ctx
    	});

    	return block;
    }

    // (234:24) {#if showIcons}
    function create_if_block_6(ctx) {
    	let span;
    	let t_value = /*item*/ ctx[12].icon + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "id", "icon");
    			add_location(span, file, 234, 28, 5525);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t_value !== (t_value = /*item*/ ctx[12].icon + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(234:24) {#if showIcons}",
    		ctx
    	});

    	return block;
    }

    // (231:12) {#each items as item}
    function create_each_block_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_5, create_else_block];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*horizontal*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(231:12) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    // (310:0) {#if buttonList}
    function create_if_block(ctx) {
    	let div;
    	let current;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "buttonList svelte-2ykskc");
    			add_location(div, file, 311, 4, 8039);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectItem, items, showIcons*/ 545) {
    				each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(310:0) {#if buttonList}",
    		ctx
    	});

    	return block;
    }

    // (315:24) {#if showIcons}
    function create_if_block_1(ctx) {
    	let span;
    	let t_value = /*item*/ ctx[12].icon + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "id", "icon");
    			add_location(span, file, 315, 28, 8285);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t_value !== (t_value = /*item*/ ctx[12].icon + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(315:24) {#if showIcons}",
    		ctx
    	});

    	return block;
    }

    // (313:12) {#each items as item}
    function create_each_block(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*item*/ ctx[12].name + "";
    	let t1;
    	let t2;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showIcons*/ ctx[5] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(span, "id", "itemText");
    			add_location(span, file, 317, 24, 8376);
    			attr_dev(div, "class", "buttonListBtn svelte-2ykskc");
    			add_location(div, file, 313, 20, 8118);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(div, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*selectItem*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*showIcons*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*items*/ 1) && t1_value !== (t1_value = /*item*/ ctx[12].name + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: -100, y: -100, duration: 500 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { x: -100, y: -100, duration: 500 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(313:12) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block0;
    	let t;
    	let if_block1_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_if_block_9];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*darkMode*/ ctx[4] && !/*buttonList*/ ctx[6]) return 0;
    		if (!/*buttonList*/ ctx[6]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	let if_block1 = /*buttonList*/ ctx[6] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				} else {
    					if_block0 = null;
    				}
    			}

    			if (/*buttonList*/ ctx[6]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*buttonList*/ 64) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { items } = $$props;
    	let { title } = $$props;
    	let { dropDown = false } = $$props;
    	let { horizontal = false } = $$props;
    	let { darkMode = false } = $$props;
    	let { showIcons } = $$props;
    	let { buttonList = false } = $$props;
    	let dropDownState = "closed";
    	let dropDownText = "+";

    	function selectItem(event) {
    		let selection = event.target.textContent;
    		dispatch("select", { selection });
    	}

    	function changeDropDownState() {
    		if (dropDownState === "closed") {
    			$$invalidate(7, dropDownState = "open");
    			$$invalidate(8, dropDownText = "-");
    		} else {
    			$$invalidate(7, dropDownState = "closed");
    			$$invalidate(8, dropDownText = "+");
    		}
    	}

    	const writable_props = [
    		"items",
    		"title",
    		"dropDown",
    		"horizontal",
    		"darkMode",
    		"showIcons",
    		"buttonList"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("List", $$slots, []);

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("dropDown" in $$props) $$invalidate(2, dropDown = $$props.dropDown);
    		if ("horizontal" in $$props) $$invalidate(3, horizontal = $$props.horizontal);
    		if ("darkMode" in $$props) $$invalidate(4, darkMode = $$props.darkMode);
    		if ("showIcons" in $$props) $$invalidate(5, showIcons = $$props.showIcons);
    		if ("buttonList" in $$props) $$invalidate(6, buttonList = $$props.buttonList);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		slide,
    		fly,
    		fade,
    		dispatch,
    		items,
    		title,
    		dropDown,
    		horizontal,
    		darkMode,
    		showIcons,
    		buttonList,
    		dropDownState,
    		dropDownText,
    		selectItem,
    		changeDropDownState
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("dropDown" in $$props) $$invalidate(2, dropDown = $$props.dropDown);
    		if ("horizontal" in $$props) $$invalidate(3, horizontal = $$props.horizontal);
    		if ("darkMode" in $$props) $$invalidate(4, darkMode = $$props.darkMode);
    		if ("showIcons" in $$props) $$invalidate(5, showIcons = $$props.showIcons);
    		if ("buttonList" in $$props) $$invalidate(6, buttonList = $$props.buttonList);
    		if ("dropDownState" in $$props) $$invalidate(7, dropDownState = $$props.dropDownState);
    		if ("dropDownText" in $$props) $$invalidate(8, dropDownText = $$props.dropDownText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		items,
    		title,
    		dropDown,
    		horizontal,
    		darkMode,
    		showIcons,
    		buttonList,
    		dropDownState,
    		dropDownText,
    		selectItem,
    		changeDropDownState
    	];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			items: 0,
    			title: 1,
    			dropDown: 2,
    			horizontal: 3,
    			darkMode: 4,
    			showIcons: 5,
    			buttonList: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console.warn("<List> was created without expected prop 'items'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<List> was created without expected prop 'title'");
    		}

    		if (/*showIcons*/ ctx[5] === undefined && !("showIcons" in props)) {
    			console.warn("<List> was created without expected prop 'showIcons'");
    		}
    	}

    	get items() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dropDown() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dropDown(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get horizontal() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set horizontal(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get darkMode() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set darkMode(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showIcons() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showIcons(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get buttonList() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buttonList(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Card.svelte generated by Svelte v3.23.2 */

    const file$1 = "src/Card.svelte";
    const get_bottom_slot_changes_1 = dirty => ({});
    const get_bottom_slot_context_1 = ctx => ({});
    const get_middle_slot_changes = dirty => ({});
    const get_middle_slot_context = ctx => ({});
    const get_bottom_slot_changes = dirty => ({});
    const get_bottom_slot_context = ctx => ({});
    const get_custom_slot_changes = dirty => ({});
    const get_custom_slot_context = ctx => ({});

    // (150:31) 
    function create_if_block_2$1(ctx) {
    	let div4;
    	let t0;
    	let div0;
    	let h2;
    	let t1;
    	let t2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t3;
    	let div2;
    	let h3;
    	let t4;
    	let t5;
    	let hr;
    	let t6;
    	let t7;
    	let div3;
    	let p;
    	let t8;
    	let t9;
    	let div4_class_value;
    	let current;
    	let if_block = /*expandable*/ ctx[7] && create_if_block_3$1(ctx);
    	const middle_slot_template = /*$$slots*/ ctx[10].middle;
    	const middle_slot = create_slot(middle_slot_template, ctx, /*$$scope*/ ctx[9], get_middle_slot_context);
    	const bottom_slot_template = /*$$slots*/ ctx[10].bottom;
    	const bottom_slot = create_slot(bottom_slot_template, ctx, /*$$scope*/ ctx[9], get_bottom_slot_context_1);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element("div");
    			h2 = element("h2");
    			t1 = text(/*title*/ ctx[2]);
    			t2 = space();
    			div1 = element("div");
    			img = element("img");
    			t3 = space();
    			div2 = element("div");
    			h3 = element("h3");
    			t4 = text(/*subtitle*/ ctx[4]);
    			t5 = space();
    			hr = element("hr");
    			t6 = space();
    			if (middle_slot) middle_slot.c();
    			t7 = space();
    			div3 = element("div");
    			p = element("p");
    			t8 = text(/*desc*/ ctx[5]);
    			t9 = space();
    			if (bottom_slot) bottom_slot.c();
    			add_location(h2, file$1, 156, 8, 3080);
    			attr_dev(div0, "class", "title svelte-1p7iug0");
    			add_location(div0, file$1, 155, 4, 3052);
    			attr_dev(img, "class", "image svelte-1p7iug0");
    			if (img.src !== (img_src_value = /*image*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 159, 8, 3145);
    			attr_dev(div1, "class", "image-span svelte-1p7iug0");
    			add_location(div1, file$1, 158, 4, 3112);
    			add_location(h3, file$1, 163, 8, 3238);
    			attr_dev(div2, "class", "subtitle svelte-1p7iug0");
    			add_location(div2, file$1, 162, 4, 3207);
    			add_location(hr, file$1, 165, 4, 3273);
    			add_location(p, file$1, 168, 8, 3341);
    			attr_dev(div3, "class", "desc");
    			add_location(div3, file$1, 167, 4, 3314);
    			attr_dev(div4, "class", div4_class_value = "" + (null_to_empty(/*mode*/ ctx[0]) + " svelte-1p7iug0"));
    			add_location(div4, file$1, 151, 0, 2928);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			if (if_block) if_block.m(div4, null);
    			append_dev(div4, t0);
    			append_dev(div4, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t1);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, img);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, h3);
    			append_dev(h3, t4);
    			append_dev(div4, t5);
    			append_dev(div4, hr);
    			append_dev(div4, t6);

    			if (middle_slot) {
    				middle_slot.m(div4, null);
    			}

    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, p);
    			append_dev(p, t8);
    			append_dev(div4, t9);

    			if (bottom_slot) {
    				bottom_slot.m(div4, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*expandable*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3$1(ctx);
    					if_block.c();
    					if_block.m(div4, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*title*/ 4) set_data_dev(t1, /*title*/ ctx[2]);

    			if (!current || dirty & /*image*/ 8 && img.src !== (img_src_value = /*image*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*subtitle*/ 16) set_data_dev(t4, /*subtitle*/ ctx[4]);

    			if (middle_slot) {
    				if (middle_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(middle_slot, middle_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_middle_slot_changes, get_middle_slot_context);
    				}
    			}

    			if (!current || dirty & /*desc*/ 32) set_data_dev(t8, /*desc*/ ctx[5]);

    			if (bottom_slot) {
    				if (bottom_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(bottom_slot, bottom_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_bottom_slot_changes_1, get_bottom_slot_context_1);
    				}
    			}

    			if (!current || dirty & /*mode*/ 1 && div4_class_value !== (div4_class_value = "" + (null_to_empty(/*mode*/ ctx[0]) + " svelte-1p7iug0"))) {
    				attr_dev(div4, "class", div4_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(middle_slot, local);
    			transition_in(bottom_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(middle_slot, local);
    			transition_out(bottom_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    			if (middle_slot) middle_slot.d(detaching);
    			if (bottom_slot) bottom_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(150:31) ",
    		ctx
    	});

    	return block;
    }

    // (127:0) {#if layout === "layout-2"}
    function create_if_block$1(ctx) {
    	let div4;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let t1;
    	let div1;
    	let h2;
    	let t2;
    	let t3;
    	let div2;
    	let h3;
    	let t4;
    	let t5;
    	let hr;
    	let t6;
    	let t7;
    	let div3;
    	let p;
    	let t8;
    	let t9;
    	let div4_class_value;
    	let current;
    	let if_block = /*expandable*/ ctx[7] && create_if_block_1$1(ctx);
    	const custom_slot_template = /*$$slots*/ ctx[10].custom;
    	const custom_slot = create_slot(custom_slot_template, ctx, /*$$scope*/ ctx[9], get_custom_slot_context);
    	const bottom_slot_template = /*$$slots*/ ctx[10].bottom;
    	const bottom_slot = create_slot(bottom_slot_template, ctx, /*$$scope*/ ctx[9], get_bottom_slot_context);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			t2 = text(/*title*/ ctx[2]);
    			t3 = space();
    			div2 = element("div");
    			h3 = element("h3");
    			t4 = text(/*subtitle*/ ctx[4]);
    			t5 = space();
    			hr = element("hr");
    			t6 = space();
    			if (custom_slot) custom_slot.c();
    			t7 = space();
    			div3 = element("div");
    			p = element("p");
    			t8 = text(/*desc*/ ctx[5]);
    			t9 = space();
    			if (bottom_slot) bottom_slot.c();
    			attr_dev(img, "class", "image-2 svelte-1p7iug0");
    			if (img.src !== (img_src_value = /*image*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$1, 129, 8, 2470);
    			attr_dev(div0, "class", "image-span2 svelte-1p7iug0");
    			add_location(div0, file$1, 128, 4, 2436);
    			add_location(h2, file$1, 135, 8, 2655);
    			attr_dev(div1, "class", "title svelte-1p7iug0");
    			add_location(div1, file$1, 134, 4, 2627);
    			add_location(h3, file$1, 140, 8, 2728);
    			attr_dev(div2, "class", "subtitle svelte-1p7iug0");
    			add_location(div2, file$1, 139, 4, 2697);
    			add_location(hr, file$1, 142, 4, 2763);
    			add_location(p, file$1, 145, 8, 2831);
    			attr_dev(div3, "class", "desc");
    			add_location(div3, file$1, 144, 4, 2804);
    			attr_dev(div4, "class", div4_class_value = "" + (null_to_empty(/*mode*/ ctx[0]) + " svelte-1p7iug0"));
    			add_location(div4, file$1, 127, 4, 2410);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, img);
    			append_dev(div4, t0);
    			if (if_block) if_block.m(div4, null);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div1, h2);
    			append_dev(h2, t2);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, h3);
    			append_dev(h3, t4);
    			append_dev(div4, t5);
    			append_dev(div4, hr);
    			append_dev(div4, t6);

    			if (custom_slot) {
    				custom_slot.m(div4, null);
    			}

    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, p);
    			append_dev(p, t8);
    			append_dev(div4, t9);

    			if (bottom_slot) {
    				bottom_slot.m(div4, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*image*/ 8 && img.src !== (img_src_value = /*image*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (/*expandable*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(div4, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*title*/ 4) set_data_dev(t2, /*title*/ ctx[2]);
    			if (!current || dirty & /*subtitle*/ 16) set_data_dev(t4, /*subtitle*/ ctx[4]);

    			if (custom_slot) {
    				if (custom_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(custom_slot, custom_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_custom_slot_changes, get_custom_slot_context);
    				}
    			}

    			if (!current || dirty & /*desc*/ 32) set_data_dev(t8, /*desc*/ ctx[5]);

    			if (bottom_slot) {
    				if (bottom_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(bottom_slot, bottom_slot_template, ctx, /*$$scope*/ ctx[9], dirty, get_bottom_slot_changes, get_bottom_slot_context);
    				}
    			}

    			if (!current || dirty & /*mode*/ 1 && div4_class_value !== (div4_class_value = "" + (null_to_empty(/*mode*/ ctx[0]) + " svelte-1p7iug0"))) {
    				attr_dev(div4, "class", div4_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(custom_slot, local);
    			transition_in(bottom_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(custom_slot, local);
    			transition_out(bottom_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    			if (custom_slot) custom_slot.d(detaching);
    			if (bottom_slot) bottom_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(127:0) {#if layout === \\\"layout-2\\\"}",
    		ctx
    	});

    	return block;
    }

    // (153:4) {#if expandable}
    function create_if_block_3$1(ctx) {
    	let span;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*expandText*/ ctx[1]);
    			attr_dev(span, "class", "expBtn svelte-1p7iug0");
    			add_location(span, file$1, 153, 8, 2979);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*expand*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*expandText*/ 2) set_data_dev(t, /*expandText*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(153:4) {#if expandable}",
    		ctx
    	});

    	return block;
    }

    // (132:4) {#if expandable}
    function create_if_block_1$1(ctx) {
    	let span;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*expandText*/ ctx[1]);
    			attr_dev(span, "class", "expBtn svelte-1p7iug0");
    			add_location(span, file$1, 132, 8, 2554);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*expand*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*expandText*/ 2) set_data_dev(t, /*expandText*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(132:4) {#if expandable}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_if_block_2$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*layout*/ ctx[6] === "layout-2") return 0;
    		if (/*layout*/ ctx[6] === "default") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { title } = $$props;
    	let { image } = $$props;
    	let { subtitle = "" } = $$props;
    	let { desc = "" } = $$props;
    	let { mode = "card" } = $$props;
    	let { layout = "default" } = $$props;
    	let { expandable } = $$props;
    	let { expandText = "expand" } = $$props;
    	let tempMode;
    	let tempText;

    	function expand() {
    		if (expandable) {
    			if (mode !== "cardExpanded") {
    				tempMode = mode;
    				$$invalidate(0, mode = "cardExpanded");
    				tempText = expandText;
    				$$invalidate(1, expandText = "close");
    			} else {
    				$$invalidate(0, mode = tempMode);
    				$$invalidate(1, expandText = tempText);
    			}
    		}
    	}

    	

    	const writable_props = [
    		"title",
    		"image",
    		"subtitle",
    		"desc",
    		"mode",
    		"layout",
    		"expandable",
    		"expandText"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Card", $$slots, ['custom','bottom','middle']);

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("image" in $$props) $$invalidate(3, image = $$props.image);
    		if ("subtitle" in $$props) $$invalidate(4, subtitle = $$props.subtitle);
    		if ("desc" in $$props) $$invalidate(5, desc = $$props.desc);
    		if ("mode" in $$props) $$invalidate(0, mode = $$props.mode);
    		if ("layout" in $$props) $$invalidate(6, layout = $$props.layout);
    		if ("expandable" in $$props) $$invalidate(7, expandable = $$props.expandable);
    		if ("expandText" in $$props) $$invalidate(1, expandText = $$props.expandText);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		title,
    		image,
    		subtitle,
    		desc,
    		mode,
    		layout,
    		expandable,
    		expandText,
    		tempMode,
    		tempText,
    		expand
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("image" in $$props) $$invalidate(3, image = $$props.image);
    		if ("subtitle" in $$props) $$invalidate(4, subtitle = $$props.subtitle);
    		if ("desc" in $$props) $$invalidate(5, desc = $$props.desc);
    		if ("mode" in $$props) $$invalidate(0, mode = $$props.mode);
    		if ("layout" in $$props) $$invalidate(6, layout = $$props.layout);
    		if ("expandable" in $$props) $$invalidate(7, expandable = $$props.expandable);
    		if ("expandText" in $$props) $$invalidate(1, expandText = $$props.expandText);
    		if ("tempMode" in $$props) tempMode = $$props.tempMode;
    		if ("tempText" in $$props) tempText = $$props.tempText;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		mode,
    		expandText,
    		title,
    		image,
    		subtitle,
    		desc,
    		layout,
    		expandable,
    		expand,
    		$$scope,
    		$$slots
    	];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			title: 2,
    			image: 3,
    			subtitle: 4,
    			desc: 5,
    			mode: 0,
    			layout: 6,
    			expandable: 7,
    			expandText: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[2] === undefined && !("title" in props)) {
    			console.warn("<Card> was created without expected prop 'title'");
    		}

    		if (/*image*/ ctx[3] === undefined && !("image" in props)) {
    			console.warn("<Card> was created without expected prop 'image'");
    		}

    		if (/*expandable*/ ctx[7] === undefined && !("expandable" in props)) {
    			console.warn("<Card> was created without expected prop 'expandable'");
    		}
    	}

    	get title() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subtitle() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subtitle(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get desc() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set desc(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mode() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layout() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layout(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expandable() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expandable(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expandText() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expandText(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Button.svelte generated by Svelte v3.23.2 */
    const file$2 = "src/Button.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*buttonTxt*/ ctx[1]);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*mode*/ ctx[0]) + " svelte-12zvlwv"));
    			attr_dev(button, "type", "button");
    			add_location(button, file$2, 126, 0, 2788);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*activate*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*buttonTxt*/ 2) set_data_dev(t, /*buttonTxt*/ ctx[1]);

    			if (dirty & /*mode*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(/*mode*/ ctx[0]) + " svelte-12zvlwv"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { buttonTxt } = $$props;
    	let { mode = "default" } = $$props;
    	let tempMode;

    	function activate() {
    		// dispatches click to parent component so
    		// you can use on:click there as well.
    		dispatch("click");

    		// animates button
    		if (!mode.includes("Active")) {
    			tempMode = mode;
    			$$invalidate(0, mode = mode + "Active");

    			setTimeout(
    				() => {
    					$$invalidate(0, mode = tempMode);
    				},
    				500
    			);
    		}
    	}

    	const writable_props = ["buttonTxt", "mode"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, []);

    	$$self.$set = $$props => {
    		if ("buttonTxt" in $$props) $$invalidate(1, buttonTxt = $$props.buttonTxt);
    		if ("mode" in $$props) $$invalidate(0, mode = $$props.mode);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		buttonTxt,
    		mode,
    		tempMode,
    		activate
    	});

    	$$self.$inject_state = $$props => {
    		if ("buttonTxt" in $$props) $$invalidate(1, buttonTxt = $$props.buttonTxt);
    		if ("mode" in $$props) $$invalidate(0, mode = $$props.mode);
    		if ("tempMode" in $$props) tempMode = $$props.tempMode;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [mode, buttonTxt, activate];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { buttonTxt: 1, mode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*buttonTxt*/ ctx[1] === undefined && !("buttonTxt" in props)) {
    			console.warn("<Button> was created without expected prop 'buttonTxt'");
    		}
    	}

    	get buttonTxt() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buttonTxt(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mode() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.23.2 */

    const { console: console_1 } = globals;
    const file$3 = "src/App.svelte";

    // (153:1) <div style="text-align: center;" slot="middle">
    function create_middle_slot(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			p.textContent = "This text is to the right (not the default)";
    			attr_dev(img, "class", "slotImg svelte-j2vf3p");
    			if (img.src !== (img_src_value = "https://pbs.twimg.com/profile_images/1053055123193122816/IUwo6l_Q_400x400.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$3, 153, 2, 2885);
    			attr_dev(p, "class", "slotP svelte-j2vf3p");
    			add_location(p, file$3, 154, 2, 3000);
    			set_style(div, "text-align", "center");
    			attr_dev(div, "slot", "middle");
    			add_location(div, file$3, 152, 1, 2835);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, p);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_middle_slot.name,
    		type: "slot",
    		source: "(153:1) <div style=\\\"text-align: center;\\\" slot=\\\"middle\\\">",
    		ctx
    	});

    	return block;
    }

    // (190:1) <div slot="bottom">
    function create_bottom_slot_1(ctx) {
    	let div;
    	let h5;
    	let t1;
    	let list;
    	let current;

    	list = new List({
    			props: {
    				horizontal: true,
    				items: /*options*/ ctx[4],
    				buttonList: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h5 = element("h5");
    			h5.textContent = "options:";
    			t1 = space();
    			create_component(list.$$.fragment);
    			add_location(h5, file$3, 190, 2, 4152);
    			attr_dev(div, "slot", "bottom");
    			add_location(div, file$3, 189, 1, 4130);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h5);
    			append_dev(div, t1);
    			mount_component(list, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(list);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_bottom_slot_1.name,
    		type: "slot",
    		source: "(190:1) <div slot=\\\"bottom\\\">",
    		ctx
    	});

    	return block;
    }

    // (217:1) <div slot="bottom">
    function create_bottom_slot(ctx) {
    	let div;
    	let h5;
    	let t1;
    	let list;
    	let current;

    	list = new List({
    			props: {
    				horizontal: true,
    				items: /*options*/ ctx[4],
    				buttonList: true
    			},
    			$$inline: true
    		});

    	list.$on("select", /*select_handler*/ ctx[8]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h5 = element("h5");
    			h5.textContent = "options:";
    			t1 = space();
    			create_component(list.$$.fragment);
    			add_location(h5, file$3, 217, 2, 4848);
    			attr_dev(div, "slot", "bottom");
    			add_location(div, file$3, 216, 1, 4826);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h5);
    			append_dev(div, t1);
    			mount_component(list, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(list);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_bottom_slot.name,
    		type: "slot",
    		source: "(217:1) <div slot=\\\"bottom\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div0;
    	let list0;
    	let t0;
    	let br0;
    	let t1;
    	let div1;
    	let br1;
    	let br2;
    	let br3;
    	let br4;
    	let br5;
    	let t2;
    	let h20;
    	let t4;
    	let hr0;
    	let t5;
    	let list1;
    	let t6;
    	let list2;
    	let t7;
    	let br6;
    	let t8;
    	let br7;
    	let t9;
    	let list3;
    	let t10;
    	let br8;
    	let t11;
    	let list4;
    	let t12;
    	let br9;
    	let t13;
    	let list5;
    	let t14;
    	let br10;
    	let t15;
    	let list6;
    	let t16;
    	let h21;
    	let t18;
    	let hr1;
    	let t19;
    	let div2;
    	let card0;
    	let t20;
    	let card1;
    	let t21;
    	let card2;
    	let t22;
    	let card3;
    	let t23;
    	let card4;
    	let t24;
    	let card5;
    	let t25;
    	let card6;
    	let t26;
    	let card7;
    	let t27;
    	let card8;
    	let t28;
    	let div3;
    	let h22;
    	let t30;
    	let hr2;
    	let t31;
    	let button0;
    	let t32;
    	let button1;
    	let t33;
    	let button2;
    	let t34;
    	let button3;
    	let t35;
    	let hr3;
    	let current;

    	list0 = new List({
    			props: {
    				items: [{ name: "lists" }, { name: "cards" }, { name: "buttons" }],
    				title: "nav",
    				dropDown: true,
    				horizontal: true,
    				darkMode: true,
    				showIcons: false
    			},
    			$$inline: true
    		});

    	list0.$on("select", /*selectionMade*/ ctx[6]);

    	list1 = new List({
    			props: {
    				items: /*items*/ ctx[3],
    				title: "Horizontal List ",
    				dropDown: false,
    				horizontal: true,
    				darkMode: false,
    				showIcons: false
    			},
    			$$inline: true
    		});

    	list2 = new List({
    			props: {
    				items: /*itemsWIcon*/ ctx[5],
    				title: "Opening",
    				dropDown: true,
    				horizontal: true,
    				darkMode: false,
    				showIcons: false
    			},
    			$$inline: true
    		});

    	list3 = new List({
    			props: {
    				items: /*itemsWIcon*/ ctx[5],
    				title: "Default List",
    				dropDown: false,
    				horizontal: false,
    				darkMode: false,
    				showIcons: true
    			},
    			$$inline: true
    		});

    	list4 = new List({
    			props: {
    				items: /*itemsWIcon*/ ctx[5],
    				title: "Default Dropdown List",
    				dropDown: true,
    				horizontal: false,
    				darkMode: false,
    				showIcons: true
    			},
    			$$inline: true
    		});

    	list5 = new List({
    			props: {
    				items: /*itemsWIcon*/ ctx[5],
    				title: "Dark List",
    				dropDown: true,
    				horizontal: false,
    				darkMode: true,
    				showIcons: true
    			},
    			$$inline: true
    		});

    	list6 = new List({
    			props: {
    				items: /*itemsWIcon*/ ctx[5],
    				title: "Dark Horizontal",
    				dropDown: true,
    				horizontal: true,
    				darkMode: true,
    				showIcons: true
    			},
    			$$inline: true
    		});

    	card0 = new Card({
    			props: {
    				title: "Card 1",
    				image: "https://techanimate.com/wp-content/uploads/2018/01/piccolo-quotes-thumbnail-1024x576.jpg",
    				subtitle: "Card without slot Data",
    				desc: "This default card does not have slot data"
    			},
    			$$inline: true
    		});

    	card1 = new Card({
    			props: {
    				title: "Card 1",
    				desc: "This card has custom slot data",
    				subtitle: "Subtitle",
    				$$slots: { middle: [create_middle_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card2 = new Card({
    			props: {
    				mode: "shaped",
    				image: "https://techanimate.com/wp-content/uploads/2018/01/piccolo-quotes-thumbnail-1024x576.jpg",
    				title: "Shaped Card",
    				subtitle: "Not default mode",
    				desc: "Setting mode attr of this card to shaped gave this card it's shape"
    			},
    			$$inline: true
    		});

    	card3 = new Card({
    			props: {
    				title: "Layout 2 card",
    				mode: "shaped",
    				subtitle: "Card with corner badge",
    				image: "https://upload.wikimedia.org/wikipedia/en/thumb/8/88/Vegeta_Dragon_Ball.jpg/220px-Vegeta_Dragon_Ball.jpg",
    				desc: "This card has a different layout, but has shaped mode",
    				layout: "layout-2"
    			},
    			$$inline: true
    		});

    	card4 = new Card({
    			props: {
    				title: "Simple outline Mode Card",
    				image: "https://techanimate.com/wp-content/uploads/2018/01/piccolo-quotes-thumbnail-1024x576.jpg",
    				mode: "outlined",
    				desc: "no shadow here"
    			},
    			$$inline: true
    		});

    	card5 = new Card({
    			props: {
    				title: "Layout 2 with buttons",
    				subtitle: "---",
    				image: "https://upload.wikimedia.org/wikipedia/en/thumb/8/88/Vegeta_Dragon_Ball.jpg/220px-Vegeta_Dragon_Ball.jpg",
    				desc: "Nested components. A button list component is nested in this card",
    				layout: "layout-2",
    				$$slots: { bottom: [create_bottom_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card6 = new Card({
    			props: {
    				title: "Expandable Card",
    				image: "https://techanimate.com/wp-content/uploads/2018/01/piccolo-quotes-thumbnail-1024x576.jpg",
    				mode: "outlined",
    				desc: "This card can expand to full screen when clicked",
    				expandable: true
    			},
    			$$inline: true
    		});

    	card7 = new Card({
    			props: {
    				title: "Layout 2 Expandable",
    				subtitle: "---",
    				image: "https://upload.wikimedia.org/wikipedia/en/thumb/8/88/Vegeta_Dragon_Ball.jpg/220px-Vegeta_Dragon_Ball.jpg",
    				desc: "Nested components. A button list component is nested in this card",
    				layout: "layout-2",
    				expandable: true,
    				expandText: "open",
    				$$slots: { bottom: [create_bottom_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card8 = new Card({
    			props: {
    				title: "Raised",
    				image: "https://techanimate.com/wp-content/uploads/2018/01/piccolo-quotes-thumbnail-1024x576.jpg",
    				subtitle: "---",
    				mode: "raised",
    				desc: "This is a raised card"
    			},
    			$$inline: true
    		});

    	button0 = new Button({
    			props: { buttonTxt: "default button" },
    			$$inline: true
    		});

    	button1 = new Button({
    			props: {
    				buttonTxt: "outline button",
    				mode: "outline"
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler*/ ctx[10]);

    	button2 = new Button({
    			props: {
    				buttonTxt: "rounded button",
    				mode: "rounded"
    			},
    			$$inline: true
    		});

    	button3 = new Button({
    			props: { buttonTxt: "text button", mode: "text" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(list0.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			div1 = element("div");
    			br1 = element("br");
    			br2 = element("br");
    			br3 = element("br");
    			br4 = element("br");
    			br5 = element("br");
    			t2 = space();
    			h20 = element("h2");
    			h20.textContent = "Lists:";
    			t4 = space();
    			hr0 = element("hr");
    			t5 = space();
    			create_component(list1.$$.fragment);
    			t6 = space();
    			create_component(list2.$$.fragment);
    			t7 = space();
    			br6 = element("br");
    			t8 = space();
    			br7 = element("br");
    			t9 = space();
    			create_component(list3.$$.fragment);
    			t10 = space();
    			br8 = element("br");
    			t11 = space();
    			create_component(list4.$$.fragment);
    			t12 = space();
    			br9 = element("br");
    			t13 = space();
    			create_component(list5.$$.fragment);
    			t14 = space();
    			br10 = element("br");
    			t15 = space();
    			create_component(list6.$$.fragment);
    			t16 = space();
    			h21 = element("h2");
    			h21.textContent = "Cards:";
    			t18 = space();
    			hr1 = element("hr");
    			t19 = space();
    			div2 = element("div");
    			create_component(card0.$$.fragment);
    			t20 = space();
    			create_component(card1.$$.fragment);
    			t21 = space();
    			create_component(card2.$$.fragment);
    			t22 = space();
    			create_component(card3.$$.fragment);
    			t23 = space();
    			create_component(card4.$$.fragment);
    			t24 = space();
    			create_component(card5.$$.fragment);
    			t25 = space();
    			create_component(card6.$$.fragment);
    			t26 = space();
    			create_component(card7.$$.fragment);
    			t27 = space();
    			create_component(card8.$$.fragment);
    			t28 = space();
    			div3 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Buttons:";
    			t30 = space();
    			hr2 = element("hr");
    			t31 = space();
    			create_component(button0.$$.fragment);
    			t32 = space();
    			create_component(button1.$$.fragment);
    			t33 = space();
    			create_component(button2.$$.fragment);
    			t34 = space();
    			create_component(button3.$$.fragment);
    			t35 = space();
    			hr3 = element("hr");
    			add_location(br0, file$3, 81, 2, 1470);
    			attr_dev(div0, "class", "nav svelte-j2vf3p");
    			add_location(div0, file$3, 72, 0, 1245);
    			add_location(br1, file$3, 85, 0, 1518);
    			add_location(br2, file$3, 85, 4, 1522);
    			add_location(br3, file$3, 85, 8, 1526);
    			add_location(br4, file$3, 85, 12, 1530);
    			add_location(br5, file$3, 85, 16, 1534);
    			attr_dev(h20, "class", "svelte-j2vf3p");
    			add_location(h20, file$3, 86, 0, 1539);
    			add_location(hr0, file$3, 87, 0, 1555);
    			add_location(br6, file$3, 102, 0, 1843);
    			add_location(br7, file$3, 103, 0, 1848);
    			add_location(br8, file$3, 111, 1, 1998);
    			add_location(br9, file$3, 119, 0, 2155);
    			add_location(br10, file$3, 128, 0, 2301);
    			attr_dev(div1, "id", "lists");
    			attr_dev(div1, "class", "svelte-j2vf3p");
    			add_location(div1, file$3, 84, 0, 1483);
    			attr_dev(h21, "class", "svelte-j2vf3p");
    			add_location(h21, file$3, 139, 0, 2459);
    			add_location(hr1, file$3, 140, 0, 2475);
    			attr_dev(div2, "id", "cards");
    			attr_dev(div2, "class", "svelte-j2vf3p");
    			add_location(div2, file$3, 141, 0, 2480);
    			attr_dev(h22, "class", "svelte-j2vf3p");
    			add_location(h22, file$3, 240, 1, 5295);
    			add_location(hr2, file$3, 241, 1, 5314);
    			attr_dev(div3, "id", "buttons");
    			add_location(div3, file$3, 239, 0, 5255);
    			add_location(hr3, file$3, 248, 0, 5576);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(list0, div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, br0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, br1);
    			append_dev(div1, br2);
    			append_dev(div1, br3);
    			append_dev(div1, br4);
    			append_dev(div1, br5);
    			append_dev(div1, t2);
    			append_dev(div1, h20);
    			append_dev(div1, t4);
    			append_dev(div1, hr0);
    			append_dev(div1, t5);
    			mount_component(list1, div1, null);
    			append_dev(div1, t6);
    			mount_component(list2, div1, null);
    			append_dev(div1, t7);
    			append_dev(div1, br6);
    			append_dev(div1, t8);
    			append_dev(div1, br7);
    			append_dev(div1, t9);
    			mount_component(list3, div1, null);
    			append_dev(div1, t10);
    			append_dev(div1, br8);
    			append_dev(div1, t11);
    			mount_component(list4, div1, null);
    			append_dev(div1, t12);
    			append_dev(div1, br9);
    			append_dev(div1, t13);
    			mount_component(list5, div1, null);
    			append_dev(div1, t14);
    			append_dev(div1, br10);
    			append_dev(div1, t15);
    			mount_component(list6, div1, null);
    			/*div1_binding*/ ctx[7](div1);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, hr1, anchor);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(card0, div2, null);
    			append_dev(div2, t20);
    			mount_component(card1, div2, null);
    			append_dev(div2, t21);
    			mount_component(card2, div2, null);
    			append_dev(div2, t22);
    			mount_component(card3, div2, null);
    			append_dev(div2, t23);
    			mount_component(card4, div2, null);
    			append_dev(div2, t24);
    			mount_component(card5, div2, null);
    			append_dev(div2, t25);
    			mount_component(card6, div2, null);
    			append_dev(div2, t26);
    			mount_component(card7, div2, null);
    			append_dev(div2, t27);
    			mount_component(card8, div2, null);
    			/*div2_binding*/ ctx[9](div2);
    			insert_dev(target, t28, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h22);
    			append_dev(div3, t30);
    			append_dev(div3, hr2);
    			append_dev(div3, t31);
    			mount_component(button0, div3, null);
    			append_dev(div3, t32);
    			mount_component(button1, div3, null);
    			append_dev(div3, t33);
    			mount_component(button2, div3, null);
    			append_dev(div3, t34);
    			mount_component(button3, div3, null);
    			/*div3_binding*/ ctx[11](div3);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, hr3, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card1_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				card1_changes.$$scope = { dirty, ctx };
    			}

    			card1.$set(card1_changes);
    			const card5_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				card5_changes.$$scope = { dirty, ctx };
    			}

    			card5.$set(card5_changes);
    			const card7_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				card7_changes.$$scope = { dirty, ctx };
    			}

    			card7.$set(card7_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(list0.$$.fragment, local);
    			transition_in(list1.$$.fragment, local);
    			transition_in(list2.$$.fragment, local);
    			transition_in(list3.$$.fragment, local);
    			transition_in(list4.$$.fragment, local);
    			transition_in(list5.$$.fragment, local);
    			transition_in(list6.$$.fragment, local);
    			transition_in(card0.$$.fragment, local);
    			transition_in(card1.$$.fragment, local);
    			transition_in(card2.$$.fragment, local);
    			transition_in(card3.$$.fragment, local);
    			transition_in(card4.$$.fragment, local);
    			transition_in(card5.$$.fragment, local);
    			transition_in(card6.$$.fragment, local);
    			transition_in(card7.$$.fragment, local);
    			transition_in(card8.$$.fragment, local);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(list0.$$.fragment, local);
    			transition_out(list1.$$.fragment, local);
    			transition_out(list2.$$.fragment, local);
    			transition_out(list3.$$.fragment, local);
    			transition_out(list4.$$.fragment, local);
    			transition_out(list5.$$.fragment, local);
    			transition_out(list6.$$.fragment, local);
    			transition_out(card0.$$.fragment, local);
    			transition_out(card1.$$.fragment, local);
    			transition_out(card2.$$.fragment, local);
    			transition_out(card3.$$.fragment, local);
    			transition_out(card4.$$.fragment, local);
    			transition_out(card5.$$.fragment, local);
    			transition_out(card6.$$.fragment, local);
    			transition_out(card7.$$.fragment, local);
    			transition_out(card8.$$.fragment, local);
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(list0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_component(list1);
    			destroy_component(list2);
    			destroy_component(list3);
    			destroy_component(list4);
    			destroy_component(list5);
    			destroy_component(list6);
    			/*div1_binding*/ ctx[7](null);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(hr1);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div2);
    			destroy_component(card0);
    			destroy_component(card1);
    			destroy_component(card2);
    			destroy_component(card3);
    			destroy_component(card4);
    			destroy_component(card5);
    			destroy_component(card6);
    			destroy_component(card7);
    			destroy_component(card8);
    			/*div2_binding*/ ctx[9](null);
    			if (detaching) detach_dev(t28);
    			if (detaching) detach_dev(div3);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			destroy_component(button3);
    			/*div3_binding*/ ctx[11](null);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(hr3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let lists;
    	let cards;
    	let buttons;

    	let items = [
    		{ name: "Milk" },
    		{ name: "Sugar" },
    		{ name: "Flour" },
    		{ name: "Rice" },
    		{ name: "Chia" }
    	];

    	let options = [
    		{ name: "like", icon: "p" },
    		{ name: "favorite" },
    		{ name: "subscribe" },
    		{ name: "follow" }
    	];

    	let itemsWIcon = [
    		{ name: "Salt", icon: "x" },
    		{ name: "Potatoes", icon: "x" },
    		{ name: "Cabbage", icon: "x" }
    	];

    	const selectionMade = event => {
    		console.log(event.detail.selection.trim());
    		let selector = event.detail.selection.trim();

    		if (selector === "lists") {
    			lists.scrollIntoView();
    		} else if (selector === "cards") {
    			cards.scrollIntoView();
    		} else if (selector === "buttons") {
    			buttons.scrollIntoView();
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			lists = $$value;
    			$$invalidate(0, lists);
    		});
    	}

    	const select_handler = e => {
    		e.preventDefault();
    		console.log("button pressed");
    	};

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			cards = $$value;
    			$$invalidate(1, cards);
    		});
    	}

    	const click_handler = () => {
    		console.log("clicked outline button");
    	};

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			buttons = $$value;
    			$$invalidate(2, buttons);
    		});
    	}

    	$$self.$capture_state = () => ({
    		List,
    		Card,
    		Button,
    		lists,
    		cards,
    		buttons,
    		items,
    		options,
    		itemsWIcon,
    		selectionMade
    	});

    	$$self.$inject_state = $$props => {
    		if ("lists" in $$props) $$invalidate(0, lists = $$props.lists);
    		if ("cards" in $$props) $$invalidate(1, cards = $$props.cards);
    		if ("buttons" in $$props) $$invalidate(2, buttons = $$props.buttons);
    		if ("items" in $$props) $$invalidate(3, items = $$props.items);
    		if ("options" in $$props) $$invalidate(4, options = $$props.options);
    		if ("itemsWIcon" in $$props) $$invalidate(5, itemsWIcon = $$props.itemsWIcon);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		lists,
    		cards,
    		buttons,
    		items,
    		options,
    		itemsWIcon,
    		selectionMade,
    		div1_binding,
    		select_handler,
    		div2_binding,
    		click_handler,
    		div3_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
