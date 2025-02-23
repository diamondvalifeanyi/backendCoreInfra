import {
    generateUniqueBatchId,
    createAndEncryptCVV,
    createAndEncryptSerialNumber,
    decryptData,
  } from '../utils/middleware.js'; 
  import { createCardsTable, createCardsProfile } from '../config/tables.js'
  import { db } from '../config/pgDB.js';
  
  export const createCardController = async (req, res) => {
    try {
      // Ensure the cards table exists
      await createCardsTable();
  
      // Generate a unique batch ID
      const batchId = await generateUniqueBatchId();
  
      // Encrypt CVV and serial number
      const encryptedCVV = await createAndEncryptCVV();
      const encryptedSerialNumber = await createAndEncryptSerialNumber();
  
      // Extract other fields from the request body
      const {
        branch_name,
        initiator,
        card_type,
        charges,
        quantity,
        date_requested,
        status,
        actions,
        email,
      } = req.body;
  
      // Insert the new card into the database
      const result = await db.query(
        `
        INSERT INTO cards (
          batch_id,
          branch_name,
          initiator,
          card_type,
          charges,
          quantity,
          date_requested,
          status,
          actions,
          cvv,
          serial_number,
          email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *, expiry_date; 
        `,
        [
            batchId,
            branch_name,
            initiator,
            card_type,
            charges,
            quantity,
            date_requested,
            status || 'pending',
            actions || 'markAsInProgress',
            encryptedCVV,
            encryptedSerialNumber,
            email,
          ]
      );
  
      // Respond with the newly created card
      res.status(201).json({
        success: true,
        message: 'Card created successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error creating card:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create card',
        error: error.message,
      });
    }
  };
  
  export const getCardDetailsController = async (req, res) => {
    try {

      // get from params
       const { batch_id } = req.params;

       // check if missing/invalid

       if (!batch_id || typeof batch_id !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Invalid batch ID format'
        });
    }

      // Fetch the card details from the database
      const result = await db.query(
        'SELECT * FROM cards WHERE batch_id = $1',
        [batch_id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Card not found/Does not exist',
        });
      }
  
      const card = result.rows[0];
      console.log("Encrypted CVV from DB:", card.cvv);
      console.log("Encrypted Serial Number from DB:", card.serial_number);

  
      // Decrypt sensitive data (CVV and serial number)
      const decryptedCVV = await decryptData(card.cvv);
      const decryptedSerialNumber = await decryptData(card.serial_number);
  
      // Respond with the card details (including decrypted data)
      res.status(200).json({
        success: true,
        message: 'Card details retrieved successfully',
        data: {
          ...card,
          cvv: decryptedCVV,
          serial_number: decryptedSerialNumber,
        },
      });
    } catch (error) {
      console.error('Error retrieving card details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve card details',
        error: error.message,
      });
    }
  };

  // export const getCardDetailsEmail = async (req, res) => {
  //   try {
  //     // const { batch_id } = req.params;
  //     const { email } = req.body;
  
  //     // Fetch the card details from the database
  //     const result = await db.query(
  //       'SELECT * FROM cards WHERE email = $1',
  //       [email]
  //     );
  
  //     if (result.rows.length === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'Card not found/Does not exist',
  //       });
  //     }
  
  //     const card = result.rows[0];
  //     console.log("Encrypted CVV from DB:", card.cvv);
  //     console.log("Encrypted Serial Number from DB:", card.serial_number);

  
  //     // Decrypt sensitive data (CVV and serial number)
  //     const decryptedCVV = await decryptData(card.cvv);
  //     const decryptedSerialNumber = await decryptData(card.serial_number);
  
  //     // Respond with the card details (including decrypted data)
  //     res.status(200).json({
  //       success: true,
  //       message: 'Card details retrieved successfully',
  //       data: {
  //         ...card,
  //         cvv: decryptedCVV,
  //         serial_number: decryptedSerialNumber,
  //       },
  //     });
  //   } catch (error) {
  //     console.error('Error retrieving card details:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Failed to retrieve card details',
  //       error: error.message,
  //     });
  //   }
  // };

  export const getDashboardData = async (req, res) => {
    try {

      const { batch_id } = req.params;

      if (!batch_id || typeof batch_id !== 'string') {
       return res.status(400).json({
           success: false,
           message: 'Invalid batch ID format'
       });
   }

   const batchExistsQuery = `
            SELECT EXISTS (
                SELECT 1 FROM cards WHERE batch_id = $1
            );
        `;
        
        const batchExists = await db.query(batchExistsQuery, [batch_id]);
        
        if (!batchExists.rows[0].exists) {
            return res.status(404).json({
                success: false,
                message: 'Batch ID not found/No Data with batchid/Does not exists'
            });
        }

        // details to retrieve from db

      const dashboardQuery = `
        WITH recent_requests AS (
          SELECT branch_name, initiator, card_type, date_requested
          FROM cards
          WHERE batch_id = $1
          ORDER BY date_requested DESC
          LIMIT 10
        ),
        total_active_cards AS (
          SELECT COUNT(*) AS total_active
          FROM cards
          WHERE status = 'ready'
        ),
        total_pending_requests AS (
          SELECT COUNT(*) AS total_pending
          FROM cards
          WHERE status = 'pending'
        )
        SELECT
          (SELECT json_agg(recent_requests) FROM recent_requests) AS recent_requests,
          (SELECT total_active FROM total_active_cards) AS total_active_cards,
          (SELECT total_pending FROM total_pending_requests) AS total_pending_requests;
      `;
  
      const result = await db.query(dashboardQuery, [batch_id]);
  
      res.status(200).json({
        success: true,
        message: 'Dashboard data fetched successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message,
      });
    }
  };

//   export const getDashboardData = async (req, res) => {
//     try {
//         const { batch_id } = req.params;

//         // Input validation
//         if (!batch_id || typeof batch_id !== 'string') {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid batch ID format'
//             });
//         }

//         const batchExistsQuery = `
//             SELECT EXISTS (
//                 SELECT 1 FROM cards WHERE batch_id = $1
//             );
//         `;
        
//         const batchExists = await db.query(batchExistsQuery, [batch_id]);
        
//         if (!batchExists.rows[0].exists) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Batch ID not found'
//             });
//         }

//         // Separate queries for better performance and maintainability
//         const dashboardQuery = `
//             WITH recent_requests AS (
//                 SELECT 
//                     branch_name,
//                     initiator,
//                     card_type,
//                     date_requested,
//                     status
//                 FROM cards
//                 WHERE batch_id = $1
//                     AND date_requested >= NOW() - INTERVAL '30 days'
//                 ORDER BY date_requested DESC
//                 LIMIT 10
//             ),
//             cards_metrics AS (
//                 SELECT 
//                     COUNT(CASE WHEN status = 'ready' THEN 1 END) as total_active,
//                     COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pending,
//                     COUNT(*) as total_cards
//                 FROM cards
//                 WHERE batch_id = $1
//             )
//             SELECT
//                 COALESCE(
//                     (SELECT json_agg(
//                         json_build_object(
//                             'branch_name', branch_name,
//                             'initiator', initiator,
//                             'card_type', card_type,
//                             'date_requested', date_requested,
//                             'status', status
//                         )
//                     ) FROM recent_requests),
//                     '[]'::json
//                 ) AS recent_requests,
//                 cm.total_active as total_active_cards,
//                 cm.total_pending as total_pending_requests,
//                 cm.total_cards as total_cards
//             FROM cards_metrics cm;
//         `;

//         const result = await db.query(dashboardQuery, [batch_id]);

//         // Handle case where no data is found
//         if (!result.rows.length) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No dashboard data found for the specified batch'
//             });
//         }

//         // Process and transform the data
//         const dashboardData = result.rows[0];
        
//         // Add calculated metrics
//         const processedData = {
//             ...dashboardData,
//             metrics: {
//                 active_percentage: calculatePercentage(
//                     dashboardData.total_active_cards,
//                     dashboardData.total_cards
//                 ),
//                 pending_percentage: calculatePercentage(
//                     dashboardData.total_pending_requests,
//                     dashboardData.total_cards
//                 )
//             },
//             last_updated: new Date().toISOString()
//         };

//         // Cache the results if needed
//         // await cacheData(`dashboard_${batch_id}`, processedData);

//         return res.status(200).json({
//             success: true,
//             message: 'Dashboard data fetched successfully',
//             data: processedData
//         });

//     } catch (error) {
//         // Log the error for internal tracking
//         console.error('Error fetching dashboard data:', {
//             error: error.message,
//             stack: error.stack,
//             batch_id: req.params.batch_id
//         });

//         return res.status(500).json({
//             success: false,
//             message: 'Failed to fetch dashboard data',
//             // Don't expose internal error details in production
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };

// // Helper function to calculate percentages
// const calculatePercentage = (part, total) => {
//     if (!total) return 0;
//     return Number(((part / total) * 100).toFixed(2));
// };


export const createProfileController = async (req, res) => {
  try {
    // Ensure the profile table exists
    await createCardsProfile();

    // Extract other fields from the request body
    const {
      cardName,
      cardScheme,
      description,
      Branch,
      BIN,
      currency,
    } = req.body;

    // Insert the new table into the database
    const result = await db.query(
      `
      INSERT INTO profile (
        cardName,
        cardScheme,
        description,
        Branch,
        BIN,
        currency
      ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *, expiry_date; 
      `,
      [
        cardName,
        cardScheme,
        description,
        Branch,
        BIN,
        currency,
        ]
    );

    // Respond with the newly created profile
    res.status(201).json({
      success: true,
      message: 'profile created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create profile',
      error: error.message,
    });
  }
};


export const getProfileByBinController = async (req, res) => {
  try {
    const { bin } = req.params; 

    if (!bin || typeof bin !== 'string') {
      return res.status(400).json({
          success: false,
          message: 'Invalid bin format'
      });
  }

    // Query to fetch profile by BIN number
    const query = `
      SELECT * FROM profile
      WHERE BIN = $1;
    `;

    // Execute the query
    const result = await db.query(query, [bin]);

    // Check if data was found
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found for the given BIN number',
      });
    }

    // Respond with the data
    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      // Return the first matching profile
      data: result.rows[0], 
    });
  } catch (error) {
    console.error('Error fetching profile by BIN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile by BIN',
      error: error.message,
    });
  }
};