import Head from 'next/head'
import NavBar from '../navbar.js'
import NoSsr from '../no-srr.js'
import { Box, Container } from '@chakra-ui/react'
import VoxelArcade from '../voxel-arcade'

const Main = ({children,router}) =>{
    return(
        <Box as="main" pb={8}>
            <Head>
                <meta name="viewport" content="width=device-with, initial-scale=1"/>
                <title>Manuel Ortiz - Homepage</title>
            </Head>

            <NavBar path={router.asPath}/>
            
            <Container maxW="container.md" pt={14}>
                <NoSsr>
                    <VoxelArcade/>
                </NoSsr>
                {children}
            </Container>
        </Box>
    )
}

export default Main