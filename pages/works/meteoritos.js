import { Container,Badge,Link,List,ListItem } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Title,WorkImage,Meta } from "../../components/work";
import P from '../../components/paragraph'
import  Layout  from "../../components/layouts/article";

const Work =() =>{
    return (
        <Layout title="Meteoritos">
            <Container>
                <Title>
                    Meteoritos <Badge>2022</Badge>
                </Title>
                <P>
                This is a adventure game in with you can play as a carpincho, inspired in similar games like Frogger but a little touch of action.
                You must be the fastest in the road, if you want reunite with your family.
                </P>
                <List ml={4} my={4}>
                    <ListItem>
                        <Meta>Github</Meta>
                        <Link href='https://github.com/manuelxp95/Repo_cenit'>
                        https://github.com/manuelxp95/RoadToCarpincho <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Meta>Itch.io</Meta>
                        <Link href='https://ortizmanuel.itch.io/meteoritos?secret=gIrjifbPQhCR8V1Fl6CKofyHu9s'>
                        https://ortizmanuel.itch.io/road-to-carpincho <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    
                    <ListItem>
                        <Meta>Action, Casual</Meta>
                        <span>Windows</span>
                    </ListItem>
                    <ListItem>
                        <Meta>Engine</Meta>
                        <span>Godot</span>
                    </ListItem>
                </List>
                <WorkImage src="/images/works/road_to_carpincho_01.png" alt="RtC sample"/>
                <WorkImage src="/images/works/road_to_carpincho_02.png" alt="RtC sample"/>
                <WorkImage src="/images/works/road_to_carpincho_03.png" alt="RtC sample"/>
            </Container>
        </Layout>
    )
}

export default Work