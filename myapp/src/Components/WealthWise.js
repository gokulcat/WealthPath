import React from 'react';
import { Container, Row, Col }  from 'react-bootstrap';
 
const WelcomePage = () => {
  return (
    <Container style={{justifyContent:'center'}}>
      <div >
      <Row>
        <Col xs={12} md={6} lg={4}>
          <h1  style={{display:"flex",textAlign:"center",alignContent:"center",justifyContent:"center" , margin:"100px", color:"#eb60c1"}}>Welcome to Wealthwise!</h1>
          <p style={{display:"flex",textAlign:"center",alignContent:"center",justifyContent:"center" , margin:"1.5px", color:"#f799db"}}>"WE'RE HERE TO HELP YOU GET THERE"</p>
        </Col>
      </Row>
      </div>
    </Container>
  );
};
 
export default WelcomePage;
