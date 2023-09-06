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
                    Project in 2.5D dimension shift carried out in Unity Engine for the GameDev.tv JAM. The theme was "Life in 2 dimension".
                </P>
                <List ml={4} my={4}>
                    <ListItem>
                        <Meta>itch.io</Meta>
                        <Link href='https://ortizmanuel.itch.io/path-between-dimensions'>
                        ortizmanuel.itch.io/path-between-dimensions <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Meta>Platformer, Casual</Meta>
                        <span>Windows</span>
                    </ListItem>
                    <ListItem>
                        <Meta>Engine</Meta>
                        <span>Unity Engine</span>
                    </ListItem>
                </List>
                <WorkImage src="/images/works/RTB_00.png" alt="rtb sample"/>
                <WorkImage src="/images/works/RTB_01.png" alt="rtb sample"/>
                <WorkImage src="/images/works/RTB_02.png" alt="rtb sample"/>
                <WorkImage src="/images/works/RTB_03.png" alt="rtb sample"/>
            </Container>
            </Layout>
    )
}

export default Work