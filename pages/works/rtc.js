import { Container,Badge,Link,List,ListItem } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Title,WorkImage,Meta } from "../../components/work";
import P from '../../components/paragraph'
import  Layout  from "../../components/layouts/article";

const Work =() =>{
    return (
        <Layout title="Road to Carpincho">
            <Container>
                <Title>
                    Road to Carpincho <Badge>2022</Badge>
                </Title>
                <P>
                This is a adventure game in with you can play as a carpincho, inspired in similar games like Frogger but a little touch of action.
                You must be the fastest in the road, if you want reunite with your family.
                </P>
                <List ml={4} my={4}>
                    <ListItem>
                        <Meta>Github</Meta>
                        <Link href='https://github.com/manuelxp95/RoadToCarpincho'>
                        https://github.com/manuelxp95/RoadToCarpincho <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Meta>Itch.io</Meta>
                        <Link href='https://ortizmanuel.itch.io/road-to-carpincho?secret=o2ZzlqTxNEXQ3vXlBFBF5t7SEE'>
                        https://ortizmanuel.itch.io/road-to-carpincho <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Meta>Itch.io - MOBILE</Meta>
                        <Link href='https://ortizmanuel.itch.io/road-to-carpincho-mobile?secret=D4luIprb280WjDckIi8O5HeHJMs'>
                        https://ortizmanuel.itch.io/road-to-carpincho-mobile <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    
                    <ListItem>
                        <Meta>Action, Casual</Meta>
                        <span>Windows/macOs/Linux/iOs/Android</span>
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