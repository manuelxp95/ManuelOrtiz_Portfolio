import { Container,Heading,SimpleGrid,Link } from "@chakra-ui/react";
import Layout from "../components/layouts/article";
import Section from "../components/section"
import {GridItem} from '../components/grid-item';

import sampleThumbnail from '../public/images/posts/thumbnail.jpeg';


const Posts=()=>(
    <Layout title="Shots">
        <Container>
            <Heading as="h4" fontSize={20} mb={4}>
                Animation Shots 
            </Heading>
            <Section delay={0.1}>
                <SimpleGrid columns={[1,1,1]} gap={6}>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                        src="https://www.youtube.com/embed/V_bPS9pHbRU?si=xebKzr7R7aYM7xgG"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                        ></iframe>
                    </div>
                    <Heading as="h3" fontSize={16} mb={4} href="https://youtu.be/V_bPS9pHbRU?si=oDr3BT3YY5vKmHTR">
                        PSXRobbery
                    </Heading>
                </SimpleGrid>
            </Section>
        </Container>
    </Layout>
)

export default Posts