import { Container,Badge,Link,List,ListItem } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Title,WorkImage,Meta } from "../../components/work";
import P from '../../components/paragraph'
import  Layout  from "../../components/layouts/article";

const Work =() =>{
    return (
        <Layout title="Clicker Test">
            <Container>
                <Title>
                    Clicker Test <Badge>2022</Badge>
                </Title>
                <P>
                    My first clicker made entirely in Unity!                </P>
                <List ml={4} my={4}>
                    <ListItem>
                        <Meta>Github</Meta>
                        <Link href='https://github.com/manuelxp95'>
                        NaN <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Meta>Unity Play</Meta>
                        <Link href='https://play.unity.com/mg/other/webgl-builds-254626'>
                        https://play.unity.com/mg/other/webgl-builds-254626 <ExternalLinkIcon mx="2px"/>
                        </Link>
                    </ListItem>
                    
                    <ListItem>
                        <Meta>Clicker,Action, Casual</Meta>
                        <span>Windows/macOs/Linux</span>
                    </ListItem>
                    <ListItem>
                        <Meta>Engine</Meta>
                        <span>Unity</span>
                    </ListItem>
                </List>
                <WorkImage src="/images/works/clicker_test.png" alt="clicker_test sample"/>
                <WorkImage src="/images/works/clicker_test_01.png" alt="clicker_test sample"/>
                <WorkImage src="/images/works/clicker_test_02.png" alt="clicker_test sample"/>
            </Container>
            </Layout>
    )
}

export default Work