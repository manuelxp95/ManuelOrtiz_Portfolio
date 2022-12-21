import NextLink from 'next/link'
import { 
    Button,
    Container,
    Box,
    Heading,
    Image,
    Link,
    List,
    ListItem,
    Icon,
    SimpleGrid,
    useColorModeValue } from "@chakra-ui/react"
import Section from "../components/section"
import Paragraph from "../components/paragraph"
import {ChevronRightIcon} from '@chakra-ui/icons'
import Layout from '../components/layouts/article'
import { BioSection,BioYear } from '../components/bio'
import { GridItem } from '../components/grid-item'
import {
    IoLogoGithub,
    IoLogoDiscord,
    IoLogoInstagram
} from 'react-icons/io5'

const Page = () =>{
    return (
        <Layout>
            <Container>
            <Box borderRadius="lg" bg ={useColorModeValue('whiteAlpha.500','whiteAlpha.200')} p="3" mb={6} align="center">
            Hello, I'm a junior game developer based in Argentina
            </Box>
            <Box display={{md:'flex'}}>
                <Box flexGrow={1}>
                    <Heading as="h2" variant="page-title">
                        Manuel Ortiz
                    </Heading>
                    <p>Freelance / Student / Developer / Designer</p>
                </Box>
                <Box flexShrink={0} mt={{base: 4,md:0}} ml={{md:6}} align="center">
                    <Image borderColor="whiteAlpha.800" 
                        borderWidth={2} 
                        borderStyle="solid" 
                        maxWidth="100px"
                        display="inline-block"
                        borderRadius="full"
                        src="/manuel.jpeg"
                        alt="Profile Image" />
                </Box>
            </Box>
            <Section delay={0.1}>
                <Heading as="h3" variant="section-title">
                    Works
                </Heading>
                <Paragraph>
                I am an Freelancer & advanced student of the Information Systems Engineering career.

                Taking my first steps as a freelancer developer but eager to learn, and join the working market.

                I'm looking foward specialize in video game planning, design and development.

                I consider myself a predisposed person and desire to learn, a sense of responsibility, dedication and commitment to what I do. I have no problems with individual or group work. I am looking for experiences that enrich my personal and professional life.

                Currently have the projects {' '}
                <NextLink href="/works/bolas_locas">
                    <Link>Bolas Locas</Link>
                </NextLink>
                , 
                {' '}
                <NextLink href="/works/meteoritos">
                    <Link>Meteoritos</Link>
                </NextLink>
                , and  {' '}
                <NextLink href="/works/rtc">
                    <Link>Road To Carpincho</Link>
                </NextLink>
                .
                </Paragraph>
                <Box align="center" my={4}>
                    <NextLink href="/works">
                        <Button rightIcon={<ChevronRightIcon/>} colorScheme="teal">My porfolio</Button>
                    </NextLink>
                </Box>
            </Section>
            <Section delay={0.3}>
                <Heading as="h3" variant="section-title">
                    Bio
                </Heading>
                <BioSection>
                    <BioYear>1995  </BioYear>
                    Born in Corrientes, Argentina.
                </BioSection>
                <BioSection>
                    <BioYear>Present  </BioYear>
                    Currently I am studying the latest years of the carrer Ingenieria en Sistemas de Informacion at National Technological University locate in Resistencia, Argentina.
                </BioSection>
            </Section>

            {/* Create contact email 

            <Section delay={0.3}>
                <Heading as="h3" variant="section-title">
                    Contact Form
                </Heading>
                <script type="text/javascript"
                    src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js">
                </script>
                <script type="text/javascript">
                   { 
                   (function(){emailjs.init("YOUR_PUBLIC_KEY");})()
                   }
                </script>
                {/* ????????????????????????????????????????????? 

            </Section>*/}
            <Section delay={0.3}>
                <Heading as="h3" variant="section-title">
                    On the web
                </Heading>
                <List>
                    <ListItem>
                        <Link href="https://github.com/manuelxp95" target="_blank">
                            <Button variant="ghost" colorScheme="teal" leftIcon={<Icon as={IoLogoGithub}/>}>
                                @manuelxp95
                            </Button>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Link href="https://discord.gg/NnkhaEsq" target="_blank">
                            <Button 
                                variant="ghost" 
                                colorScheme="teal" 
                                leftIcon={<Icon as={IoLogoDiscord}/>}>
                                Discord
                            </Button>
                        </Link>
                    </ListItem>
                    <ListItem>
                    <Link href="https://www.instagram.com/manuelxp95/" target="_blank">
                            <Button 
                                variant="ghost" 
                                colorScheme="teal" 
                                leftIcon={<Icon as={IoLogoInstagram}/>}>
                                @manuelxp95
                            </Button>
                        </Link>
                    </ListItem>
                </List>
            </Section>
            
            </Container>
        </Layout>
    )
}

export default Page