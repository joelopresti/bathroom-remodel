# Primary Bath — Before & After (Three.js)

    npm install
    npm run dev      # http://localhost:5173

- **Existing / Compare / Remodel** buttons (Compare = draggable before/after slider)
- Remodel options are live dropdowns: shower (tiled in today's 46" opening, or a bigger walk-in that moves walls), storage above the toilet (cabinet or open shelves), wall color, floor, shower tile, tub (freestanding oval, clawfoot, built-in soaker, corner soaker, or no tub with window seat + linen cabinet), vanity finish, vanity layout (floor-standing: doors + drawer bank, or drawers + center linen tower), hardware
- Camera presets along the bottom; the "cutaway" hides walls facing away from you when orbiting outside

## Editing
- Room size: `DIM` in `src/helpers.js` (feet; ESTIMATED from photos — measure and adjust)
- Door/window positions, shower recess (`SHOWER`, measured 46" opening) and the measured back wall (67") / 27" switch wall: top of `src/shell.js`
- Half wall + toilet placement: `HALF_WALL`, `TOILET_X` in `src/existing.js` (shared by the remodel)
- Match a reference photo: `?mode=existing&cam=x,y,z&tgt=x,y,z&fov=deg`
- Existing room: `src/existing.js` · Remodel design: `src/remodel.js` · Finish options: top of `src/remodel.js`
