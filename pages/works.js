import { Container,Heading,SimpleGrid,Divider } from "@chakra-ui/react";
import Section from "../components/section";
import { WorkGridItem } from "../components/grid-item";
import thumbSaltarina from '../public/images/works/saltarina.png'
import thumbRtc from '../public/images/works/road_to_carpincho.png'
import thumbFruPath from '../public/images/works/frusting_path.png'
import thumbMeteoritos from '../public/images/works/meteoritos.png'
import thumbClickerTest from '../public/images/works/clicker_test.png'
import thumbBolasLocas from '../public/images/works/bolas_locas.png'
import thumbPbd from '../public/images/works/pbd_01.png'
import thumbRTB from '../public/images/works/RTB_00.jpg'
import thumbSopa from '../public/images/works/sopa_00.png'
import Layout from '../components/layouts/article'

// This include all my projects, between the sections 
const Works =() =>{
    return(
        <Layout>
        <Container>
            <Heading as="h3" fontSize={20} mb={4}>
                Works
            </Heading>
                <SimpleGrid columns={[1, 1, 2]} gap={6}>
                    <Section>
                        <WorkGridItem id="sopa" title="Sopa - Tale of the Stolen Potato" thumbnail={thumbSopa}>
                        StudioBando game in which I had participation as part of the development team                        </WorkGridItem>
                    </Section>
                <Section>
                    <WorkGridItem id="rtb" title="Revolucion Tecnobotanica" thumbnail= {thumbRTB}>
                    Game created during the ADVA game jam, applying knowledge in UE5.
                    </WorkGridItem>
                </Section>
                <Section>
                    <WorkGridItem id="pbd" title="Path Between Dimensions" thumbnail= {thumbPbd}>
                    Project with a theme of dimension change developed in Unity Engine.
                    </WorkGridItem>
                </Section>
                <Section>
                    <WorkGridItem id="bolas_locas" title="Bolas Locas" thumbnail= {thumbBolasLocas}>
                        My first game in Unreal Engine 5
                    </WorkGridItem>
                </Section>
                <Section>
                    <WorkGridItem id="clicker_test" title="Clicker Test" thumbnail= {thumbClickerTest}>
                        My first clicker made entirely in Unity!
                    </WorkGridItem>
                </Section>
                <Section>
                    <WorkGridItem id="meteoritos" title="Meteoritos" thumbnail= {thumbMeteoritos}>
                        Asteroids but NO!
                    </WorkGridItem>
                </Section>
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