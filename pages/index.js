import { Container,Box,Heading } from "@chakra-ui/react"

const Page = () =>{
    return (
        <Container>
            <Box borderRadius="lg" bg ="red" p="3" mb={6} align="center">
            Hello, I'm a trainee game developer based in Argentina
            </Box>
            <Box display={{md:'flex'}}>
                <Box flexGrow={1}>
                    <Heading as="h2" variant="page-title">
                        Manuel Ortiz
                    </Heading>
                    <p>Studient / Developer / Designer</p>
                </Box>
            </Box>
        </Container>
    )
}

export default Page