import { Container,Badge,Link,List,ListItem } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Title,WorkImage,Meta } from "../../components/work";
import P from '../../components/paragraph'
import  Layout  from "../../components/layouts/article";

const Work =() =>{
    return (
        <Layout title="Revolucion Tecnobotanica">
            <Container>
                <Title>
                    Revolucion Tecnobotanica <Badge>2023</Badge>
                </Title>
                <P>
                In "Revolución Tecnobotánica," the player embarks on an adventure where they must obtain enough Chayannets and use them to shut down the Mother Cyberplant. Along the way, all the other Cyberplant daughters will try to prevent it from happening. The goal is to collect all the Chayannets, reach the Mother Cyberplant, and save the world.
                </P>
                <List ml={4} my={4}>
                    <ListItem>
                        <Meta>itch.io</Meta>
                        <Link href='https://elithne.itch.io/revolucion-tecnobotanica'>
                        elithne.itch.io/revolucion-tecnobotanica <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Meta>Platformer, Casual</Meta>
                        <span>Windows</span>
                    </ListItem>
                    <ListItem>
                        <Meta>Engine</Meta> 
                        <span>Unreal Engine 5</span>
                    </ListItem>
                </List>
                <WorkImage src="/images/works/RTB_00.jpg" alt="rtb sample"/>
                <WorkImage src="/images/works/RTB_01.jpg" alt="rtb sample"/>
                <WorkImage src="/images/works/RTB_02.jpg" alt="rtb sample"/>
                <WorkImage src="/images/works/RTB_03.jpg" alt="rtb sample"/>
            </Container>
            </Layout>
    )
}

export default Work