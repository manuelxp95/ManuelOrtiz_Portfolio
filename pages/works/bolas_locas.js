import { Container,Badge,Link,List,ListItem } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Title,WorkImage,Meta } from "../../components/work";
import P from '../../components/paragraph'
import  Layout  from "../../components/layouts/article";

const Work =() =>{
    return (
        <Layout title="Bolas Locas">
            <Container>
                <Title>
                    Bolas Locas <Badge>2022</Badge>
                </Title>
                <P>
                    My first game in Unreal Engine 5. Score all the balls you can to win!              
                </P>
                <List ml={4} my={4}>
                    <ListItem>
                        <Meta>Github</Meta>
                        <Link href='https://github.com/manuelxp95/BolasLocas-Unreal5.1'>
                        github.com/manuelxp95/BolasLocas-Unreal5.1 <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Meta>Puzzle, Casual</Meta>
                        <span>Windows/macOs/Linux</span>
                    </ListItem>
                    <ListItem>
                        <Meta>Engine</Meta>
                        <span>Unreal Engine 5</span>
                    </ListItem>
                </List>
                <WorkImage src="/images/works/bolas_locas.png" alt="bolas_locas sample"/>
                <WorkImage src="/images/works/bolas_locas01.png" alt="bolas_locas sample"/>
                <WorkImage src="/images/works/bolas_locas02.png" alt="bolas_locas sample"/>
            </Container>
            </Layout>
    )
}

export default Work