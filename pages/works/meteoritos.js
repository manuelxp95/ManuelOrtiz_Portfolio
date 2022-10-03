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
                Have you played Asteroids (1976)? well... this is worse! BUT IN GODOT!
                </P>
                <List ml={4} my={4}>
                    <ListItem>
                        <Meta>Github</Meta>
                        <Link href='https://github.com/manuelxp95/Repo_cenit'>
                        https://github.com/manuelxp95/Repo_cenit <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Meta>Itch.io</Meta>
                        <Link href='https://ortizmanuel.itch.io/meteoritos?secret=gIrjifbPQhCR8V1Fl6CKofyHu9s'>
                        https://ortizmanuel.itch.io/meteoritos <ExternalLinkIcon mx="2px"/>
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
                <WorkImage src="/images/works/meteoritos_01.png" alt="meteoritos sample"/>
                <WorkImage src="/images/works/meteoritos_02.png" alt="meteoritos sample"/>
                <WorkImage src="/images/works/meteoritos_03.png" alt="meteoritos sample"/>
            </Container>
        </Layout>
    )
}

export default Work