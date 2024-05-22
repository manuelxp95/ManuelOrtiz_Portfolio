import { Container,Badge,Link,List,ListItem } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Title,WorkImage,Meta } from "../../components/work";
import P from '../../components/paragraph'
import  Layout  from "../../components/layouts/article";

const Work =() =>{
    return (
        <Layout title="Sopa - Tale of the Stolen Potato">
            <Container>
                <Title>
                    Sopa - Tale of the Stolen Potato <Badge>2024</Badge>
                </Title>
                <P>
                    A captivating and poignant journey into the depths of human connection and the legacy we leave behind, inspired by Miyazaki, Coco, and The Little Prince. In this game, I worked on the game design team, focusing on implementing animations and game mechanics, as well as lighting and optimization, to create a profound and unforgettable experience.
                </P>
                <List ml={4} my={4}>
                    <ListItem>
                        <Meta>steam</Meta>
                        <Link href='https://store.steampowered.com/app/1935330/Sopa__Tale_of_the_Stolen_Potato/?l=latam'>
                        Steam Page <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Meta>Adventure, Narrative</Meta>
                        <span>Windows, Xbox Series</span>
                    </ListItem>
                    <ListItem>
                        <Meta>Engine</Meta> 
                        <span>Unity Engine</span>
                    </ListItem>
                </List>
                <WorkImage src="/images/works/sopa_01.jpg" alt="sopa sample"/>
                <WorkImage src="/images/works/sopa_02.jpg" alt="sopa sample"/>
                <WorkImage src="/images/works/sopa_03.jpg" alt="sopa sample"/>
                <WorkImage src="/images/works/sopa_04.jpg" alt="sopa sample"/>
            </Container>
            </Layout>
    )
}

export default Work