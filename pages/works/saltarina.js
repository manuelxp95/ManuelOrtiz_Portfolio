import { Container,Badge,Link,List,ListItem } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Title,WorkImage,Meta } from "../../components/work";
import P from '../../components/paragraph'
import  Layout  from "../../components/layouts/article";

const Work =() =>{
    return (
        <Layout title="Saltarina">
            <Container>
                <Title>
                    Saltarina <Badge>2021</Badge>
                </Title>
                <P>
                    example description
                </P>
                <List ml={4} my={4}>
                    <ListItem>
                        <Meta>Github</Meta>
                        <Link href='https://github.com/manuelxp95/PSaltarina'>
                        https://github.com/manuelxp95/PSaltarina <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Meta>Platform</Meta>
                        <span>Windows/macOs/Linux/iOs/Android</span>
                    </ListItem>
                    <ListItem>
                        <Meta>Engine</Meta>
                        <span>Godot</span>
                    </ListItem>
                </List>
                <WorkImage src="/images/works/saltarina_01.png" alt="Saltarina sample"/>
                <WorkImage src="/images/works/saltarina_02.png" alt="Saltarina sample"/>
            </Container>
        </Layout>
    )
}

export default Work