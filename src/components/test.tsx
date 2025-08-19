'use client';

import {useState, Suspense} from 'react'
import {Canvas} from '@react-three/fiber'
import {OrbitControls} from '@react-three/drei'
import Earth from '../../public/models/Earth'

export default function Test() {

    return (
        <Canvas>
            <Suspense fallback={null}>
                <Earth />
            </Suspense>
            <OrbitControls />
        </Canvas>
    )
}
