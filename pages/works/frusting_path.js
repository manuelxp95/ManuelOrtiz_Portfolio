import { Container,Badge,Link,List,ListItem } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Title,WorkImage,Meta } from "../../components/work";
import P from '../../components/paragraph'
import  Layout  from "../../components/layouts/article";

const Work =() =>{
    return (
        <Layout title="Frusting Path">
            <Container>
                <Title>
                    Frusting Path <Badge>2022</Badge>
                </Title>
                <P>
                Choose a card and travel with Larry (THE COCK) in a path totally unfair.
                 Do your best to try to get as far as possible!
                </P>
                <List ml={4} my={4}>
                    <ListItem>
                        <Meta>Github</Meta>
                        <Link href='https://github.com/manuelxp95/Programming-Theory-Repo'>
                        https://github.com/manuelxp95/Programming-Theory-Repo <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Meta>Unity Play</Meta>
                        <Link href='https://play.unity.com/mg/other/webgl-builds-198309'>
                        https://play.unity.com/mg/other/webgl-builds-198309 <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    
                    <ListItem>
                        <Meta>Casual</Meta>
                        <span>Windows/macOs/Linux</span>
                    </ListItem>
                    <ListItem>
                        <Meta>Engine</Meta>
                        <span>Unity</span>
                    </ListItem>
                </List>
                <WorkImage src="/images/works/frusting_path01.jpg" alt="Larry sample"/>
                <WorkImage src="/images/works/frusting_path02.jpg" alt="Larry sample"/>
                <WorkImage src="/images/works/frusting_path03.jpg" alt="Larry sample"/>
            </Container>
        </Layout>
    )
}

export default Work