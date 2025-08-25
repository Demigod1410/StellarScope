'use client';

import {useState, Suspense} from 'react'
import {Canvas} from '@react-three/fiber'
import {OrbitControls} from '@react-three/drei'
import Earth2 from '../../public/Earth2'

export default function Test() {

    return (
        <Canvas>
            <Suspense fallback={null}>
                <Earth2 />
            </Suspense>
            <OrbitControls />
        </Canvas>
    )
}
