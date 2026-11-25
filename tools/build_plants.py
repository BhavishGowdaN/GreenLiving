# GREEN LIVING — botanical GLB generator v2 (Blender 5.x headless)
# Original plant models with meshes named "Part_<Key>__<n>".
# Run:  blender -b --factory-startup -P build_plants.py
import bpy, bmesh, math, os, random
from mathutils import Vector, Euler, Matrix

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "models")
PREV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "preview")
os.makedirs(OUT, exist_ok=True)
os.makedirs(PREV, exist_ok=True)
random.seed(7)

COL = {
    "stem":      (0.30, 0.42, 0.29, 1),
    "stemDark":  (0.26, 0.36, 0.27, 1),
    "cane":      (0.62, 0.66, 0.38, 1),
    "leafDeep":  (0.16, 0.30, 0.20, 1),
    "leafMid":   (0.30, 0.44, 0.28, 1),
    "leafLight": (0.42, 0.54, 0.34, 1),
    "olive":     (0.44, 0.52, 0.30, 1),
    "sage":      (0.62, 0.68, 0.57, 1),
    "vein":      (0.68, 0.66, 0.50, 1),
    "champ":     (0.78, 0.66, 0.42, 1),
    "mustard":   (0.86, 0.68, 0.20, 1),
    "sunYellow": (0.95, 0.78, 0.14, 1),
    "terrac":    (0.76, 0.42, 0.26, 1),
    "terrac2":   (0.82, 0.50, 0.33, 1),
    "blush":     (0.90, 0.80, 0.75, 1),
    "blush2":    (0.87, 0.70, 0.65, 1),
    "white":     (0.97, 0.96, 0.92, 1),
    "cream":     (0.93, 0.89, 0.74, 1),
    "root":      (0.80, 0.74, 0.62, 1),
    "soil":      (0.26, 0.20, 0.14, 1),
    "bulb":      (0.82, 0.76, 0.64, 1),
    "charcoal":  (0.14, 0.16, 0.13, 1),
    "anther":    (0.10, 0.12, 0.10, 1),
    "spine":     (0.90, 0.87, 0.76, 1),
    "cactus":    (0.30, 0.45, 0.31, 1),
    "rosewood":  (0.24, 0.36, 0.26, 1),
    "fruitRed":  (0.60, 0.20, 0.14, 1),
    "figLeaf":   (0.24, 0.40, 0.24, 1),
    "spathe":    (0.97, 0.96, 0.91, 1),
    "spadix":    (0.93, 0.87, 0.68, 1),
}

def M(key, rough=0.55):
    name = "mat_" + key
    mat = bpy.data.materials.get(name)
    if mat: return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = COL[key]
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = 0.0
    return mat

# ---------------------------------------------------------------- helpers
def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.objects, bpy.data.lights, bpy.data.cameras):
        for b in list(block):
            if b.users == 0: block.remove(b)

def smooth(obj):
    for p in obj.data.polygons: p.use_smooth = True

def finish(bm, name, mat, part, shade=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(obj)
    if mat: obj.data.materials.append(mat)
    obj.name = f"Part_{part}__{name}"
    if shade: smooth(obj)
    return obj

def rotX(elev_from_horizontal):
    """Blade built pointing +Y (up). Returns rotation so the length axis
       rises at `elev_from_horizontal` radians above horizontal (+Z outward)."""
    return -(math.pi / 2) + elev_from_horizontal

def lean(deg):
    """Small lean (deg) from vertical for upright blades."""
    return math.radians(deg)

def tube(pts, radii, mat, part, name, segs=9):
    bm = bmesh.new()
    if not isinstance(radii, (list, tuple)): radii = [radii] * len(pts)
    P = [Vector(p) for p in pts]
    rings = []
    for i, p in enumerate(P):
        if i == 0: t = P[1] - P[0]
        elif i == len(P) - 1: t = P[-1] - P[-2]
        else: t = P[i + 1] - P[i - 1]
        t.normalize()
        up = Vector((0, 1, 0)) if abs(t.y) < 0.9 else Vector((1, 0, 0))
        xa = t.cross(up).normalized(); ya = t.cross(xa).normalized()
        r = radii[i]
        ring = [bm.verts.new(p + xa * math.cos(2 * math.pi * s / segs) * r +
                             ya * math.sin(2 * math.pi * s / segs) * r) for s in range(segs)]
        rings.append(ring)
    for i in range(len(rings) - 1):
        for s in range(segs):
            v1, v2 = rings[i][s], rings[i][(s + 1) % segs]
            v3, v4 = rings[i + 1][(s + 1) % segs], rings[i + 1][s]
            try: bm.faces.new((v1, v2, v3, v4))
            except ValueError: pass
    try: bm.faces.new(rings[0])
    except ValueError: pass
    try: bm.faces.new(reversed(rings[-1]))
    except ValueError: pass
    return finish(bm, name, mat, part)

def prof_ctrl(points):
    """Piecewise smooth leaf width profile. points: [(t, width01)...].
       smoothstep between control points; clamps at ends."""
    pts = sorted(points)
    def f(t):
        t = min(1.0, max(0.0, t))
        for i in range(len(pts) - 1):
            t0, w0 = pts[i]; t1, w1 = pts[i + 1]
            if t0 <= t <= t1:
                if t1 - t0 < 1e-6: return w1
                k = (t - t0) / (t1 - t0)
                k = k * k * (3 - 2 * k)          # smoothstep
                return w0 + (w1 - w0) * k
        return pts[-1][1]
    return f

PROF = {
    "oval":   prof_ctrl([(0, 0.06), (0.08, 0.35), (0.4, 0.95), (0.75, 0.7), (1, 0.02)]),
    "heart":  prof_ctrl([(0, 0.45), (0.12, 0.75), (0.42, 1.0), (0.75, 0.72), (0.92, 0.3), (1, 0.02)]),
    "sword":  prof_ctrl([(0, 0.55), (0.2, 0.8), (0.6, 0.62), (1, 0.04)]),
    "tepal":  prof_ctrl([(0, 0.30), (0.25, 0.62), (0.62, 1.0), (0.88, 0.86), (1, 0.10)]),
    "petal":  prof_ctrl([(0, 0.22), (0.3, 0.75), (0.6, 1.0), (0.85, 0.6), (1, 0.03)]),
    "petalW": prof_ctrl([(0, 0.12), (0.25, 0.6), (0.55, 1.0), (0.82, 0.75), (1, 0.12)]),
    "fiddle": prof_ctrl([(0, 0.10), (0.18, 0.28), (0.35, 0.42), (0.62, 1.0), (0.76, 0.48),
                         (0.86, 0.52), (0.96, 0.25), (1, 0.03)]),
    "monstera": prof_ctrl([(0, 0.10), (0.12, 0.55), (0.42, 1.0), (0.7, 0.8), (0.9, 0.4), (1, 0.03)]),
    "leaflet": prof_ctrl([(0, 0.10), (0.3, 0.85), (0.65, 0.8), (1, 0.04)]),
    "lance":  prof_ctrl([(0, 0.08), (0.35, 0.9), (0.7, 0.6), (1, 0.02)]),
}

def blade(L, W, prof, mat, part, name, rows=22, cols=6, thick=0.006,
          droop=0.16, cup=0.10, fold=0.0, slits=None, base_lift=0.0):
    """Solid leaf/petal blade. Base at origin pointing +Y; bends by droop
       (tip bends toward -Z = downward when laid) + cup across width."""
    bm = bmesh.new()
    grid = []
    for i in range(rows + 1):
        t = i / rows
        w = W * prof(t)
        row = []
        for j in range(2 * cols + 1):
            u = j / (2 * cols)
            x = (u * 2 - 1) * w
            y = t * L
            s = t * t
            z = -droop * s * L * 0.55
            z += cup * ((abs(u * 2 - 1)) ** 2) * W
            z += fold * (abs(x) / max(W, 1e-5)) * W * 0.45
            if base_lift: z += base_lift * (1 - t) * (1 - t)
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    for i in range(rows):
        for j in range(2 * cols):
            t = (i + 0.5) / rows
            side = 1 if j >= cols else -1
            skip = False
            if slits:
                ac = abs(grid[i][j].co.x) / max(W, 1e-5)
                for (t0, t1, s_) in slits:
                    if s_ in (0, side) and t0 <= t <= t1 and 0.30 < ac < 0.95:
                        skip = True; break
            if not skip:
                try: bm.faces.new((grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
                except ValueError: pass
    obj = finish(bm, name, mat, part)
    sol = obj.modifiers.new("sol", 'SOLIDIFY')
    sol.thickness = thick
    sol.offset = -1
    return obj

def blade_at(loc, rot_z, elev_or_lean, mat, part, name, upright=False, **kw):
    """Place a blade at loc, yawed rot_z around Z.
       upright=True: elev_or_lean is a small lean from vertical (deg).
       otherwise: elevation above horizontal (deg)."""
    b = blade(mat=mat, part=part, name=name, **kw)
    b.location = Vector(loc)
    rx = lean(elev_or_lean) if upright else rotX(math.radians(elev_or_lean))
    b.rotation_euler = Euler((rx, 0, rot_z))
    return b

def ball(center, r, mat, part, name, sx=1, sy=1, sz=1, seg=(16, 12)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg[0], v_segments=seg[1], radius=r)
    obj = finish(bm, name, mat, part)
    obj.scale = (sx, sy, sz)
    obj.location = Vector(center)
    return obj

def cone(base, direction, r, h, mat, part, name, segs=7, shade=False):
    bm = bmesh.new()
    d = Vector(direction).normalized()
    up = Vector((0, 1, 0)) if abs(d.y) < 0.9 else Vector((1, 0, 0))
    xa = d.cross(up).normalized(); ya = d.cross(xa).normalized()
    tip = bm.verts.new(Vector(base) + d * h)
    ringv = [bm.verts.new(Vector(base) + xa * math.cos(2 * math.pi * s / segs) * r +
                          ya * math.sin(2 * math.pi * s / segs) * r) for s in range(segs)]
    for s in range(segs):
        bm.faces.new((ringv[s], ringv[(s + 1) % segs], tip))
    bm.faces.new(ringv)
    return finish(bm, name, mat, part, shade)

def ring(n, fn, yaw0=0.0):
    return [fn(i, yaw0 + 2 * math.pi * i / n) for i in range(n)]

def radial(yaw, radius):
    """x,z offset on a ring."""
    return (math.sin(yaw) * radius, math.cos(yaw) * radius)

def roots(mat, count, spread, depth, thick=0.016, start=(0, 0, 0)):
    out = []
    for i in range(count):
        a = 2 * math.pi * i / count + 0.35
        s = spread * (0.7 + (i % 3) * 0.18)
        d = depth * (0.75 + (i % 4) * 0.08)
        pts = [start,
               (start[0] + math.cos(a) * s * 0.3, start[1] - d * 0.3, start[2] + math.sin(a) * s * 0.3),
               (start[0] + math.cos(a) * s * 0.75, start[1] - d * 0.65, start[2] + math.sin(a) * s * 0.75),
               (start[0] + math.cos(a) * s, start[1] - d, start[2] + math.sin(a) * s)]
        r = [thick * 1.3, thick, thick * 0.7, thick * 0.28]
        out.append(tube(pts, r, mat, "Roots", f"rt{i}", segs=8))
    return out

def soil_disc(r, part="Soil"):
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, segments=48, radius=r)
    obj = finish(bm, "soil", M("soil"), part, shade=False)
    obj.rotation_euler = Euler((math.radians(-90), 0, 0))
    return obj

def vein_net(L, W, prof, mat, part, name, droop=0.16, cup=0.10, side_n=4):
    """Veins hugging the blade surface (same bend formulas as blade())."""
    out = []
    def z(t, u):
        return -droop * (t ** 2) * L * 0.55 + cup * ((abs(u * 2 - 1)) ** 2) * W + 0.005
    mid = [(0, t * L, z(t, 0.5)) for t in [i / 10 for i in range(11)]]
    out.append(tube(mid, 0.005, mat, part, name + "mid", segs=6))
    for i in range(1, side_n + 1):
        t = i / (side_n + 1); y = t * L
        for s in (1, -1):
            pts = []
            for j in range(5):
                f = j / 4
                u = 0.5 + s * 0.4 * f
                pts.append((s * W * prof(t) * 0.82 * f, y + f * L * 0.06, z(t + f * 0.05, u)))
            out.append(tube(pts, 0.0026, mat, part, f"{name}s{i}{'p' if s > 0 else 'm'}", segs=5))
    return out

# ================================================================ plants
def build_monstera():
    soil_disc(0.72)
    roots(M("root"), 8, 0.56, 0.68)
    tube([(0, -0.05, 0), (0.05, 0.35, 0.02), (-0.04, 0.7, -0.02), (0.02, 1.05, 0.01)],
         0.05, M("stem"), "Stem", "stem", segs=12)
    for i, y in enumerate((0.32, 0.62, 0.94)):
        ball((0.04 - i * 0.028, y, 0.012 - i * 0.014), 0.058, M("sage"), "Node", f"node{i}", sy=0.55)
    for i, (y, dx) in enumerate(((0.5, 0.5), (0.8, -0.45))):
        tube([(0.03, y, 0), (dx * 0.7, y - 0.25, 0.08 * (1 if i else -1)),
              (dx, y - 0.7, 0.1 * (-1 if i else 1))], 0.016, M("root"), "AerialRoots", f"aerial{i}", segs=8)
    nodes = [dict(y=0.32, x=0.04, yaw=math.radians(-52), tilt=38, L=1.0),
             dict(y=0.62, x=-0.02, yaw=math.radians(132), tilt=34, L=0.85),
             dict(y=0.94, x=0.02, yaw=math.radians(235), tilt=30, L=0.75)]
    slits = [(0.26, 0.34, 1), (0.44, 0.52, -1), (0.60, 0.68, 1), (0.76, 0.84, -1), (0.36, 0.42, -1)]
    for k, n in enumerate(nodes):
        yaw = n["yaw"]
        px, py, pz = n["x"], n["y"], 0.0
        tip = (px + math.sin(yaw) * 0.32, n["y"] + 0.34, math.cos(yaw) * 0.32)
        tube([(px, py, pz), (px + math.sin(yaw) * 0.18, py + 0.16, math.cos(yaw) * 0.18), tip],
             0.03, M("stem"), "Petiole", f"pet{k}", segs=8)
        L = n["L"]; W = L * 0.46
        b = blade_at(tip, yaw, n["tilt"], M("leafDeep"), "Leaf", f"blade{k}",
                     L=L, W=W, prof=PROF["monstera"], rows=26, cols=9, thick=0.006,
                     droop=0.28, cup=0.06, slits=slits)
        for v in vein_net(L, W, PROF["monstera"], M("vein"), "Vein", f"vn{k}", droop=0.28, cup=0.06, side_n=4):
            v.location = Vector(tip)
            v.rotation_euler = b.rotation_euler

def build_rose():
    soil_disc(0.55)
    roots(M("root"), 7, 0.42, 0.58)
    tube([(0, -0.02, 0), (0.03, 0.4, 0.02), (-0.02, 0.75, -0.01), (0.01, 1.12, 0)],
         0.034, M("rosewood"), "Stem", "stem", segs=10)
    for i in range(8):
        a = i * 2.1; y = 0.15 + i * 0.12
        cone((math.cos(a) * 0.038, y, math.sin(a) * 0.038), (math.cos(a), 0.5, math.sin(a)),
             0.010, 0.048, M("charcoal"), "Thorn", f"thorn{i}", segs=6)
    tube([(-0.01, 0.76, 0), (-0.25, 0.93, 0.05), (-0.40, 1.0, 0.08)],
         0.022, M("rosewood"), "Branch", "branch", segs=8)
    def compound_leaf(baseY, side, yaw, tag):
        tube([(0, baseY, 0), (side * 0.12, baseY + 0.08, 0.03), (side * 0.24, baseY + 0.13, 0.05)],
             0.016, M("stem"), "Petiole", f"pet{tag}", segs=6)
        for k, (dy, ddx) in enumerate(((0.16, 0.08), (-0.02, 0.02), (0.16, -0.04))):
            blade_at((side * 0.24 + ddx * 0.14, baseY + 0.13 + dy, 0.05),
                     yaw + (k - 1) * math.radians(38), 55, M("leafMid"), "Leaf", f"lf{tag}{k}",
                     L=0.32, W=0.13, prof=PROF["oval"], rows=14, cols=5, thick=0.004,
                     droop=0.10, cup=0.06)
    compound_leaf(0.42, 1, math.radians(69), "a")
    compound_leaf(0.66, -1, math.radians(-52), "b")
    ball((0.01, 1.10, 0), 0.075, M("olive"), "Sepal", "recept")
    ring(5, lambda i, a: blade_at((Vector((0.01, 1.13, 0)) + Vector((radial(a, 0.05)[0], 0, radial(a, 0.05)[1]))).to_tuple(),
                                  a, 58, M("olive"), "Sepal", f"sep{i}",
                                  L=0.15, W=0.05, prof=PROF["lance"], rows=10, cols=4,
                                  thick=0.004, droop=0.3, cup=0.08), yaw0=math.radians(30))
    # rose bloom: layered cupped petals
    ring(9, lambda i, a: blade_at((Vector((0.01, 1.16, 0)) + Vector((radial(a, 0.05)[0], 0, radial(a, 0.05)[1]))).to_tuple(),
                                  a, 38, M("blush"), "Petal", f"petO{i}",
                                  L=0.40, W=0.19, prof=PROF["petalW"], rows=16, cols=7,
                                  thick=0.005, droop=-0.10, cup=0.30))
    ring(7, lambda i, a: blade_at((Vector((0.01, 1.18, 0)) + Vector((radial(a + 0.25, 0.032)[0], 0, radial(a + 0.25, 0.032)[1]))).to_tuple(),
                                  a + 0.25, 55, M("blush2"), "Petal", f"petM{i}",
                                  L=0.34, W=0.16, prof=PROF["petalW"], rows=16, cols=7,
                                  thick=0.005, droop=-0.16, cup=0.38))
    ring(6, lambda i, a: blade_at((Vector((0.01, 1.20, 0)) + Vector((radial(a + 0.5, 0.018)[0], 0, radial(a + 0.5, 0.018)[1]))).to_tuple(),
                                  a + 0.5, 70, M("blush"), "Petal", f"petI{i}",
                                  L=0.27, W=0.12, prof=PROF["petalW"], rows=14, cols=6,
                                  thick=0.004, droop=-0.26, cup=0.44))
    for i in range(14):
        a = i * 0.45
        tube([(0.01 + math.cos(a) * 0.015, 1.20, math.sin(a) * 0.015),
              (0.01 + math.cos(a) * 0.05, 1.27, math.sin(a) * 0.05)],
             0.0035, M("champ"), "Stamen", f"fil{i}", segs=5)
        ball((0.01 + math.cos(a) * 0.05, 1.275, math.sin(a) * 0.05), 0.014, M("mustard"),
             "Stamen", f"an{i}", seg=(8, 6))
    for i in range(5):
        a = i * 1.256
        tube([(0.01 + math.cos(a) * 0.012, 1.20, math.sin(a) * 0.012),
              (0.01 + math.cos(a) * 0.02, 1.29, math.sin(a) * 0.02)],
             0.0055, M("white"), "Pistil", f"sty{i}", segs=5)
        ball((0.01 + math.cos(a) * 0.02, 1.295, math.sin(a) * 0.02), 0.009, M("white"),
             "Pistil", f"stg{i}", seg=(8, 6))
    # bud at branch tip
    ball((-0.40, 1.0, 0.08), 0.05, M("blush"), "Bud", "budcore", sy=1.9, seg=(12, 9))
    ring(3, lambda i, a: blade_at((Vector((-0.40, 0.97, 0.08)) + Vector((radial(a, 0.03)[0], 0, radial(a, 0.03)[1]))).to_tuple(),
                                  a, 62, M("olive"), "Sepal", f"bsep{i}",
                                  L=0.13, W=0.04, prof=PROF["lance"], rows=9, cols=4,
                                  thick=0.003, droop=0.4, cup=0.15))

def build_sunflower():
    soil_disc(0.6)
    roots(M("root"), 6, 0.44, 0.8)
    tube([(0, -0.02, 0), (0.02, -0.4, 0.01), (-0.015, -0.75, -0.01), (0.02, -0.95, 0.02)],
         [0.055, 0.045, 0.032, 0.02], M("root"), "Taproot", "taproot", segs=9)
    tube([(0, -0.02, 0), (0.05, 0.7, 0.02), (-0.03, 1.5, -0.02), (0.02, 2.1, 0)],
         [0.05, 0.046, 0.042, 0.038], M("stem"), "Stem", "stem", segs=12)
    for k, (y, side, yaw, L) in enumerate(((0.55, 1, math.radians(86), 0.8),
                                           (0.95, -1, math.radians(-74), 0.7))):
        tube([(0, y, 0), (side * 0.18, y + 0.07, 0.04), (side * 0.34, y + 0.12, 0.07)],
             0.022, M("stem"), "Petiole", f"pet{k}", segs=7)
        blade_at((side * 0.34, y + 0.12, 0.07), yaw, 32, M("leafMid"), "Leaf", f"blade{k}",
                 L=L, W=L * 0.38, prof=PROF["heart"], rows=22, cols=8, thick=0.006,
                 droop=0.22, cup=0.05)
        for v in vein_net(L, L * 0.38, PROF["heart"], M("vein"), "Vein", f"vn{k}",
                          droop=0.22, cup=0.05, side_n=5):
            v.location = (side * 0.34, y + 0.12, 0.07)
            v.rotation_euler = Euler((rotX(math.radians(32)), 0, yaw))
    # ---- head (tilted toward +Z so the disc faces the viewer) ----
    H = 2.1
    TILT = math.radians(28)
    R_head = Matrix.Rotation(TILT, 4, 'X').to_4x4()   # head plane tilted toward viewer
    T_head = Matrix.Translation((0, H, 0))
    def ring3d(n, radius, y0, elev_deg, mats, part, tag, L, W, prof, droop, cup,
               thick=0.004, yaw0=0.0):
        """Ring of blades in the tilted head plane, positioned and oriented
           consistently via matrices."""
        for i in range(n):
            a = yaw0 + 2 * math.pi * i / n
            loc_local = Vector((math.sin(a) * radius, y0, math.cos(a) * radius))
            m = mats[i % len(mats)]
            b = blade(L, W, prof, m, part, f"{tag}{i}", rows=14, cols=6, thick=thick,
                      droop=droop, cup=cup)
            b.rotation_euler = Euler((rotX(math.radians(elev_deg)), 0, a))
            b.matrix_world = T_head @ R_head @ Matrix.Translation(loc_local) @ b.matrix_basis
    ring3d(10, 0.17, -0.05, -26, [M("olive")], "Bract", "bract", 0.22, 0.05,
           PROF["lance"], droop=0.35, cup=0.05)
    ring3d(26, 0.24, -0.02, 16, [M("sunYellow"), M("mustard")], "RayFloret", "ray",
           0.58, 0.10, PROF["petalW"], droop=-0.05, cup=0.06)
    d = ball((0, H + 0.02, 0), 0.3, M("olive"), "Bract", "recept", sy=0.34)
    d.rotation_euler = Euler((TILT, 0, 0))
    for i in range(64):
        a = i * 2.39996
        rr = 0.02 + 0.19 * math.sqrt(i / 64)
        loc_local = Vector((math.cos(a) * rr, 0.085, math.sin(a) * rr))
        key = "Seed" if i % 4 == 0 else "DiscFloret"
        c = cone((0, 0, 0), (0, 1, 0), 0.014, 0.045,
                 M("champ") if key == "DiscFloret" else M("charcoal"), key, f"fl{i}", segs=6)
        c.matrix_world = T_head @ R_head @ Matrix.Translation(loc_local) @ c.matrix_basis

def build_lily():
    soil_disc(0.55)
    roots(M("root"), 8, 0.46, 0.62)
    leaves = [dict(yaw=math.radians(17), tilt=30, L=0.8, h=0.7),
              dict(yaw=math.radians(109), tilt=35, L=0.72, h=0.62),
              dict(yaw=math.radians(200), tilt=27, L=0.68, h=0.55),
              dict(yaw=math.radians(286), tilt=38, L=0.6, h=0.5)]
    for k, l in enumerate(leaves):
        tx, tz = math.sin(l["yaw"]) * 0.34, math.cos(l["yaw"]) * 0.34
        tube([(0, 0, 0), (tx * 0.4, l["h"] * 0.55, tz * 0.4), (tx, l["h"], tz)],
             0.024, M("stem"), "Petiole", f"pet{k}", segs=8)
        blade_at((tx, l["h"], tz), l["yaw"], l["tilt"], M("leafDeep"), "Leaf", f"blade{k}",
                 L=l["L"], W=l["L"] * 0.4, prof=PROF["oval"], rows=20, cols=6, thick=0.005,
                 droop=0.2, cup=0.05)
        for v in vein_net(l["L"], l["L"] * 0.4, PROF["oval"], M("vein"), "Vein", f"vn{k}",
                          droop=0.2, cup=0.05, side_n=5):
            v.location = (tx, l["h"], tz)
            v.rotation_euler = Euler((rotX(math.radians(l["tilt"])), 0, l["yaw"]))
    fTilt, fYaw, h = math.radians(20), math.radians(63), 0.95
    tube([(0, 0, 0), (math.sin(fYaw) * 0.2, h * 0.6, math.cos(fYaw) * 0.2),
          (math.sin(fYaw) * 0.38, h, math.cos(fYaw) * 0.38)], 0.026, M("stem"), "Petiole", "petf", segs=8)
    b = blade(0.55, 0.17, PROF["tepal"], M("spathe"), "Spathe", "spathe",
              rows=16, cols=6, thick=0.005, droop=-0.12, cup=0.28)
    b.location = (math.sin(fYaw) * 0.38, h, math.cos(fYaw) * 0.38)
    b.rotation_euler = Euler((rotX(math.radians(64)) + fTilt, 0, fYaw))
    sd = ball((math.sin(fYaw) * 0.38, h + 0.12, math.cos(fYaw) * 0.38), 0.032,
              M("spadix"), "Spadix", "spadix", sy=4.0, seg=(12, 9))
    sd.rotation_euler = Euler((fTilt, 0, 0))
    for i in range(10):
        y = 0.02 + (i % 5) * 0.055
        a = (i // 5) * math.pi
        ball((math.sin(fYaw) * 0.38 + math.cos(a) * 0.03, h + 0.02 + y,
              math.cos(fYaw) * 0.38 + math.sin(a) * 0.03), 0.006, M("champ"),
             "Spadix", f"sp{i}", seg=(6, 4))

def build_snake():
    soil_disc(0.5)
    ball((0.02, -0.04, 0), 0.075, M("bulb"), "Rhizome", "rhizome", sx=3.0, sz=1.2, seg=(14, 8))
    roots(M("root"), 7, 0.36, 0.52)
    blades = [(0, 0, 1.5, 0, "leafDeep"), (0.09, 0.05, 1.25, math.radians(29), "leafMid"),
              (-0.08, 0.04, 1.35, math.radians(-34), "leafMid"),
              (0.05, -0.07, 1.05, math.radians(149), "leafDeep"),
              (-0.06, -0.06, 1.15, math.radians(-143), "leafDeep"),
              (0.11, -0.02, 0.85, math.radians(92), "leafMid"),
              (-0.11, 0.01, 0.8, math.radians(-86), "leafDeep")]
    for k, (x, z, h, yaw, ck) in enumerate(blades):
        b = blade(h, 0.11, PROF["sword"], M(ck), "Leaf", f"blade{k}",
                  rows=20, cols=4, thick=0.016, droop=0.10, cup=0.0, fold=0.5)
        b.location = (x, 0.0, z)
        b.rotation_euler = Euler((lean(random.uniform(-4, 4)), 0, yaw))
    tube([(0.14, 0, 0.02), (0.17, 0.7, 0.04), (0.15, 1.3, 0.03), (0.12, 1.62, 0.02)],
         0.013, M("olive"), "Scape", "scape", segs=8)
    for i in range(6):
        y = 1.28 + i * 0.065; a = i * 1.9
        ball((0.12 + math.cos(a) * 0.03, y, 0.02 + math.sin(a) * 0.03), 0.02,
             M("white"), "Flower", f"fl{i}", sy=2.6, seg=(8, 6))

def build_palm():
    soil_disc(0.65)
    roots(M("root"), 8, 0.5, 0.68)
    canes = [(0, 0, 1.6, 0), (0.12, -0.08, 1.3, math.radians(34)), (-0.11, 0.06, 1.05, math.radians(-40))]
    for k, (x, z, h, yaw) in enumerate(canes):
        tube([(x, -0.02, z), (x + 0.02, h * 0.4, z), (x - 0.015, h * 0.75, z), (x + 0.01, h, z)],
             0.045, M("cane"), "Cane", f"cane{k}", segs=10)
        for j, y in enumerate([v for v in [0.35, 0.65, 0.95] if v < h - 0.12]):
            ball((x, y, z), 0.047, M("olive"), "Node", f"node{k}{j}", sy=0.5)
        # arching frond: rachis curves outward and droops
        tip = Vector((x + math.sin(yaw) * 0.95 + 0.1, h - 0.35, z + math.cos(yaw) * 0.95))
        tube([(x + 0.01, h, z),
              (x + math.sin(yaw) * 0.3 + 0.12, h + 0.16, z + math.cos(yaw) * 0.3),
              (x + math.sin(yaw) * 0.62 + 0.12, h + 0.08, z + math.cos(yaw) * 0.62),
              tuple(tip)], 0.02, M("olive"), "Rachis", f"rachis{k}", segs=8)
        for i in range(16):
            t = 0.12 + (i / 15) * 0.8
            px = x + math.sin(yaw) * (0.2 + t * 0.8) + 0.12 * (1 - t)
            pz = z + math.cos(yaw) * (0.2 + t * 0.8)
            py = h + 0.16 - t * 0.5
            for side in (1, -1):
                ll = blade(0.4 - t * 0.12, 0.045, PROF["leaflet"],
                           M("leafLight") if side > 0 else M("leafMid"), "Leaflet",
                           f"lf{k}{i}{'p' if side > 0 else 'm'}", rows=10, cols=3,
                           thick=0.003, droop=0.3, cup=0.12)
                ll.location = (px, py, pz)
                ll.rotation_euler = Euler((rotX(math.radians(-8)), 0, yaw + side * math.radians(72)))
    for i in range(5):
        a = i * 1.25
        ball((0.18 + math.cos(a) * 0.05, 0.04 + (i % 2) * 0.035, 0.1 + math.sin(a) * 0.05),
             0.028, M("mustard"), "Fruit", f"fruit{i}", seg=(8, 6))

def build_fig():
    soil_disc(0.6)
    roots(M("root"), 8, 0.48, 0.62)
    tube([(0, -0.02, 0), (0.02, 0.35, 0.01), (-0.01, 0.7, -0.01), (0.015, 0.95, 0)],
         [0.05, 0.04, 0.033, 0.028], M("rosewood"), "Stem", "trunk", segs=10)
    tube([(0.0, 0.55, 0), (0.16, 0.72, 0.04), (0.3, 0.8, 0.05)], 0.02, M("rosewood"), "Branch", "branchA", segs=8)
    tube([(-0.01, 0.68, 0), (-0.14, 0.88, -0.03), (-0.26, 0.97, -0.04)], 0.018, M("rosewood"), "Branch", "branchB", segs=8)
    leafspots = [dict(loc=(0.015, 0.95, 0), yaw=math.radians(10), tilt=36),
                 dict(loc=(0.3, 0.8, 0.05), yaw=math.radians(48), tilt=28),
                 dict(loc=(-0.26, 0.97, -0.04), yaw=math.radians(-40), tilt=30),
                 dict(loc=(0.02, 0.62, 0), yaw=math.radians(150), tilt=24)]
    for k, s in enumerate(leafspots):
        tube([(s["loc"][0] - math.sin(s["yaw"]) * 0.14, s["loc"][1] - 0.14, s["loc"][2] - math.cos(s["yaw"]) * 0.14),
              s["loc"]], 0.018, M("stem"), "Petiole", f"pet{k}", segs=7)
        L = 0.5
        blade_at(s["loc"], s["yaw"], s["tilt"], M("figLeaf"), "Leaf", f"blade{k}",
                 L=L, W=L * 0.42, prof=PROF["fiddle"], rows=22, cols=7, thick=0.006,
                 droop=0.24, cup=0.06)
        for v in vein_net(L, L * 0.42, PROF["fiddle"], M("vein"), "Vein", f"vn{k}",
                          droop=0.24, cup=0.06, side_n=4):
            v.location = s["loc"]
            v.rotation_euler = Euler((rotX(math.radians(s["tilt"])), 0, s["yaw"]))

def build_tulip():
    soil_disc(0.45)
    ball((0, -0.42, 0), 0.14, M("bulb"), "Bulb", "bulb", sy=1.05, seg=(14, 10))
    for o in roots(M("root"), 8, 0.26, 0.48):
        o.location.y -= 0.44
    tube([(0, -0.12, 0), (0.015, 0.5, 0.005), (-0.01, 0.95, -0.005), (0.005, 1.22, 0)],
         0.03, M("stem"), "Stem", "stem", segs=10)
    for k, (side, yaw) in enumerate(((1, math.radians(23)), (-1, math.radians(-34)))):
        b = blade(0.95, 0.11, PROF["sword"], M("leafMid"), "Leaf", f"blade{k}",
                  rows=18, cols=4, thick=0.012, droop=0.14, cup=0.0, fold=0.45)
        b.location = (side * 0.05, -0.05, 0)
        b.rotation_euler = Euler((lean(9), 0, yaw))
    FY = 1.22
    ring(3, lambda i, a: blade_at((Vector((0.005, FY, 0)) + Vector((radial(a, 0.035)[0], 0, radial(a, 0.035)[1]))).to_tuple(),
                                  a, 66, M("terrac"), "Tepal", f"tepO{i}",
                                  L=0.52, W=0.19, prof=PROF["tepal"], rows=16, cols=7,
                                  thick=0.006, droop=-0.22, cup=0.40))
    ring(3, lambda i, a: blade_at((Vector((0.005, FY + 0.02, 0)) + Vector((radial(a + math.radians(60), 0.02)[0], 0, radial(a + math.radians(60), 0.02)[1]))).to_tuple(),
                                  a + math.radians(60), 76, M("terrac2"), "Tepal", f"tepI{i}",
                                  L=0.46, W=0.17, prof=PROF["tepal"], rows=16, cols=7,
                                  thick=0.005, droop=-0.3, cup=0.46))
    for i in range(6):
        a = i * 1.047 + 0.5
        tube([(math.cos(a) * 0.02, FY + 0.03, math.sin(a) * 0.02),
              (math.cos(a) * 0.04, FY + 0.2, math.sin(a) * 0.04)],
             0.0045, M("cream"), "Stamen", f"fil{i}", segs=5)
        ball((math.cos(a) * 0.042, FY + 0.235, math.sin(a) * 0.042), 0.014,
             M("anther"), "Stamen", f"an{i}", sy=1.7, seg=(8, 6))
    ball((0, FY + 0.04, 0), 0.035, M("cream"), "Pistil", "ovary", seg=(10, 8))
    tube([(0, FY + 0.07, 0), (0.005, FY + 0.22, 0.002)], 0.011, M("cream"), "Pistil", "style", segs=6)
    ball((0.005, FY + 0.23, 0.002), 0.018, M("cream"), "Pistil", "stigma", seg=(8, 6))

def build_cactus():
    soil_disc(0.5)
    roots(M("root"), 6, 0.4, 0.3, thick=0.013)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=48, radius1=0.26, radius2=0.3, depth=1.05)
    for v in bm.verts:
        a = math.atan2(v.co.z, v.co.x)
        k = 1 + 0.085 * math.cos(a * 9)
        v.co.x *= k; v.co.z *= k
    col = finish(bm, "column", M("cactus"), "Stem")
    col.location = (0, 0.5, 0)
    ball((0, 1.02, 0), 0.26, M("cactus"), "Stem", "cap", sy=0.5, seg=(24, 10))
    ribAs = (math.radians(20), math.radians(140), math.radians(260))
    for j, a in enumerate(ribAs):
        x, z = math.cos(a) * 0.27, math.sin(a) * 0.27
        for i, y in enumerate((0.18, 0.34, 0.5, 0.66, 0.82)):
            ball((x, y, z), 0.021, M("root"), "Areole", f"areole{j}{i}", seg=(8, 6))
            for s in range(3):
                cone((x * 1.06, y + 0.02, z * 1.06),
                     (math.cos(a) * 1.4 + (s - 1) * 0.3, 0.55 + s * 0.12, math.sin(a) * 1.4 + (s - 1) * 0.3),
                     0.006, 0.09, M("spine"), "Spine", f"spine{j}{i}{s}", segs=5)
    flowerY = None  # (unused in v2)
    FY = 1.16
    ring(8, lambda i, a: blade_at((Vector((0.05, FY, 0)) + Vector((radial(a, 0.03)[0], 0, radial(a, 0.03)[1]))).to_tuple(),
                                  a, 58, M("blush"), "Flower", f"fpet{i}",
                                  L=0.28, W=0.11, prof=PROF["tepal"], rows=12, cols=6,
                                  thick=0.004, droop=-0.18, cup=0.32))
    ball((0.05, FY + 0.06, 0), 0.04, M("champ"), "Flower", "fcore", seg=(10, 8))
    ball((-0.24, 1.06, 0.08), 0.075, M("fruitRed"), "Fruit", "fruit", sy=1.5, seg=(12, 8))

# ================================================================ preview + export
def render_preview(name):
    scene = bpy.context.scene
    objs = [o for o in bpy.context.collection.objects if o.type == 'MESH']
    pts = []
    for o in objs:
        for corner in o.bound_box:
            pts.append(o.matrix_world @ Vector(corner))
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    ctr = (mn + mx) / 2
    size = max((mx - mn).length, 0.5)
    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
    bpy.context.collection.objects.link(cam)
    d = size * 1.15
    cam.location = (ctr.x + d * 0.75, ctr.y - d * 0.55, ctr.z + d * 0.22)
    direction = ctr - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 55
    scene.camera = cam
    # lights
    sun = bpy.data.lights.new("sun", 'SUN')
    sun.energy = 3.0
    sun_o = bpy.data.objects.new("sun", sun)
    bpy.context.collection.objects.link(sun_o)
    sun_o.rotation_euler = Euler((math.radians(50), 0, math.radians(30)))
    fill = bpy.data.lights.new("fill", 'AREA')
    fill.energy = 250; fill.size = 3
    fill_o = bpy.data.objects.new("fill", fill)
    bpy.context.collection.objects.link(fill_o)
    fill_o.location = (ctr.x - d, ctr.y + d * 0.3, ctr.z + d * 0.5)
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (0.92, 0.90, 0.86, 1)
    bg.inputs[1].default_value = 0.6
    eng = None
    for e in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE', 'CYCLES'):
        try:
            scene.render.engine = e; eng = e; break
        except Exception: pass
    if eng == 'CYCLES':
        scene.cycles.samples = 32
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.film_transparent = True
    scene.render.filepath = os.path.join(PREV, name + ".png")
    bpy.ops.render.render(write_still=True)
    for o in (cam, sun_o, fill_o):
        bpy.data.objects.remove(o)

def export(name):
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT, name + ".glb"),
        export_format='GLB', export_apply=True, export_yup=True,
        export_materials='EXPORT', export_image_format='AUTO')

BUILDERS = dict(monstera=build_monstera, rose=build_rose, sunflower=build_sunflower,
                lily=build_lily, snake=build_snake, palm=build_palm, fig=build_fig,
                tulip=build_tulip, cactus=build_cactus)

for name, fn in BUILDERS.items():
    clear()
    try:
        fn()
        export(name)
        render_preview(name)
        print("OK", name)
    except Exception as e:
        import traceback
        print("FAIL", name, repr(e))
        traceback.print_exc()
print("DONE")
