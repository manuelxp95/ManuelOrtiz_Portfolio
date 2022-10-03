import { Container,Heading,SimpleGrid,Divider } from "@chakra-ui/react";
import Section from "../components/section";
import { WorkGridItem } from "../components/grid-item";
import thumbSaltarina from '../public/images/works/saltarina.png'
import thumbRtc from '../public/images/works/road_to_carpincho.png'
import thumbFruPath from '../public/images/works/frusting_path.png'
import Layout from '../components/layouts/article'

// This include all my projects, between the sections 
const Works =() =>{
    return(
        <Layout>
        <Container>
            <Heading as="h3" fontSize={20} mb={4}>
                Works
            </Heading>
            <SimpleGrid columns={[1,1,2]} gap={6}>
                <Section>
                    <WorkGridItem id="frusting_path" title="Frusting Path" thumbnail= {thumbFruPath}>
                        My first Casual game in Unity! You will have to choose and explode!
                    </WorkGridItem>
                </Section>
                <Section>
                    <WorkGridItem id="rtc" title="Road to Carpincho" thumbnail= {thumbRtc}>
                        A action game 2D, cross the road if you can.
                    </WorkGridItem>
                </Section>
                <Section>
                    <WorkGridItem id="saltarina" title="Saltarina" thumbnail= {thumbSaltarina}>
                        A game plataformer like Mario
                    </WorkGridItem>
                </Section>
            </SimpleGrid>
        </Container>
        </Layout>
    )
};

export default Works